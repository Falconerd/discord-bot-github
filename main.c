#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <fcntl.h>
#include <pthread.h>
#include <stdarg.h>
#include <errno.h>
#include <pthread.h>
#include <sys/time.h>
#include "tiny-json.h"

/* TODO:
 * [X] implement thread pool
 * [X] test what happens when using slow DOS attack
 * [X] read the request body into a string
 * [ ] extract relevant data from the string
         * does this need to be a tree?
 * [ ] print what the discord message would be
 * [X] timeout after N seconds

 * [ ] implement HMAC SHA-256
 * [ ] check github signature

 * [ ] connect to discord with a bot authentication
 * [ ] create a hash table to store all subscriptions
 * [ ] copy mongodb subscriptions into a file
 * [ ] create the flat file db format
	 * <org>/<repo> <channel_id> [<secret>]
	 * if the webhook has a hash, any enties without one are invalid
	 * this gives us private repos, too
	 * for now the db will be 1 line per entry, no need to over-complicate it
 * [ ] read db into memory on startup
 * [ ] create query function into db
 * [ ] write all action responses
 * [ ] discord command for adding repo
 	 * if not private, don't check if repo exists
 	 	 * could create db bloat via bad actors
 	 	 * perhaps if private flag is used, a verification event is needed?
 	 * make sure to check for duplicates
 * [ ] discord command for removing repo
 * [ ] remove all unecessary printing or put to logs
 */

/* Many thanks to Jacob Sorber
 * https://www.youtube.com/watch?v=Pg_4Jz8ZIH4&list=PL9IEJIKnBJjH_zM5LnovnoaKlXML5qh17
 */

#define THREAD_POOL_SIZE 50
#define PORT 8080
#define SERVER_BACKLOG 100
#define BUFFER_SIZE 20000

typedef struct sockaddr_in SA_IN;
typedef struct sockaddr SA;

pthread_t thread_pool[THREAD_POOL_SIZE];
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t condition_var = PTHREAD_COND_INITIALIZER;

typedef struct string {
	char *data;
	size_t length;
} String;

typedef struct queue_item Queue_Item;
struct queue_item {
	int *client_socket;
	Queue_Item *next;
};

typedef struct queue {
	Queue_Item *head;
	Queue_Item *tail;
} Queue;

Queue queue = {0};

// we don't really care about data locality
// just use fragmented list
typedef struct list_item List_Item;
struct list_item {
	char *buffer;
	size_t length;
	List_Item *next;
};

typedef struct list {
	List_Item *head;
	List_Item *tail;
} List;

List_Item *append(List *list) {
	if (list->tail == NULL) {
		list->tail = malloc(sizeof(List_Item));
		if (list->tail == NULL) {
			// TODO handle out of memory
		}
		list->head = list->tail;
		return list->tail;
	}

	List_Item *temp = malloc(sizeof(List_Item));
	temp->next = NULL;
	list->tail->next = temp;
	list->tail = temp;
	return list->tail;
}

List_Item *pop(List *list) {
	if (list->head == NULL)
		return NULL;
	List_Item *item = list->head;
	list->head = list->head->next; 
	return item;
}

void enqueue(int *client_socket) {
	Queue_Item *queue_item = malloc(sizeof(Queue_Item));
	queue_item->client_socket = client_socket;
	queue_item->next = NULL;
	if (queue.tail == NULL)
		queue.head = queue_item;
	else
		queue.tail->next = queue_item;
	queue.tail = queue_item;
}

int *dequeue() {
	if (queue.head == NULL) {
		return NULL;
	} else {

	int *result = queue.head->client_socket;
	Queue_Item *temp = queue.head;
	queue.head = queue.head->next;
	if (queue.head == NULL)
		queue.tail = NULL;
	free(temp);
	return result;
	}
}

/* event types */
// check_run
// check_suite
// code_scanning_alert
// commit_comment
// content_reference
// create
// delete
// deploy_key
// deployment
// deployment_status
// discussion
// discussion_comment
// fork
// github_app_authorization
// gollum
// installation
// installation_repositories
// issue_comment
// issues
// label
// marketplace_purchase
// member
// membership
// meta
// milestone
// organization
// org_block
// package
// page_build
// ping
// project_card
// project_column
// project
// public
// pull_request
// pull_request_review
// pull_request_review_comment
// push
// release
// repository_dispatch
// repository
// repository_import
// repository_vulnerability_alert
// secret_scanning_alert
// security_advisory
// sponsorship
// star
// status
// team
// team_add
// watch
// workflow_dispatch
// workflow_run

/*
 * turn json object into tree
 * 
 * input: {
  "zen": "woah",
  "foo": {
    "bar": "wat",
    "baz": 42,
    "wow": {
      "surpise": 17
    }
  },
  "xor": "xand"
}
 * output:
 * zen: woah - foo - xor: xand
 *              | 
 *             bar: wat - baz: 42
 */

typedef struct node Node;
struct node {
	String key;
	String value;
	Node *next;
	Node *child; // if child != NULL, value is NULL
	Node *parent;
};

typedef struct tree {
	Node *root;
} Tree;

Node *tree_create(Tree *tree, Node *parent, Node *prev) {
	Node *node = malloc(sizeof(Node));
	memset(node, 0, sizeof(Node));
	if (parent == NULL) {
		tree->root = node;
		return node;
	} else {
		if (parent->child == NULL) {
			parent->child = node;
		}
	}

	if (prev != NULL) {
		prev->next = node;
	}
	node->parent = parent;

	return node;
}

char *ping_payload = "{\"zen\":\"Design for failure.\",\"hook_id\":301812344,\"test\":[1,2,3,4],\"hook\":{\"type\":\"Repository\",\"id\":301812344,\"name\":\"web\",\"active\":true,\"events\":[\"*\"],\"config\":{\"content_type\":\"form\",\"insecure_ssl\":\"0\",\"secret\":\"********\",\"url\":\"http://58.84.181.43:8080\"},\"updated_at\":\"2021-06-10T10:10:42Z\",\"created_at\":\"2021-06-10T10:10:42Z\",\"url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/hooks/301812344\",\"test_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/hooks/301812344/test\",\"ping_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/hooks/301812344/pings\",\"last_response\":{\"code\":null,\"status\":\"unused\",\"message\":null}},\"repository\":{\"id\":48586289,\"node_id\":\"MDEwOlJlcG9zaXRvcnk0ODU4NjI4OQ==\",\"name\":\"discord-bot-github\",\"full_name\":\"Falconerd/discord-bot-github\",\"private\":false,\"owner\":{\"login\":\"Falconerd\",\"id\":1349538,\"node_id\":\"MDQ6VXNlcjEzNDk1Mzg=\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/1349538?v=4\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/Falconerd\",\"html_url\":\"https://github.com/Falconerd\",\"followers_url\":\"https://api.github.com/users/Falconerd/followers\",\"following_url\":\"https://api.github.com/users/Falconerd/following{/other_user}\",\"gists_url\":\"https://api.github.com/users/Falconerd/gists{/gist_id}\",\"starred_url\":\"https://api.github.com/users/Falconerd/starred{/owner}{/repo}\",\"subscriptions_url\":\"https://api.github.com/users/Falconerd/subscriptions\",\"organizations_url\":\"https://api.github.com/users/Falconerd/orgs\",\"repos_url\":\"https://api.github.com/users/Falconerd/repos\",\"events_url\":\"https://api.github.com/users/Falconerd/events{/privacy}\",\"received_events_url\":\"https://api.github.com/users/Falconerd/received_events\",\"type\":\"User\",\"site_admin\":false},\"html_url\":\"https://github.com/Falconerd/discord-bot-github\",\"description\":\"A bot for discord which consumes the GitHub API and gives you updates.\",\"fork\":false,\"url\":\"https://api.github.com/repos/Falconerd/discord-bot-github\",\"forks_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/forks\",\"keys_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/keys{/key_id}\",\"collaborators_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/collaborators{/collaborator}\",\"teams_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/teams\",\"hooks_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/hooks\",\"issue_events_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/issues/events{/number}\",\"events_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/events\",\"assignees_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/assignees{/user}\",\"branches_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/branches{/branch}\",\"tags_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/tags\",\"blobs_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/git/blobs{/sha}\",\"git_tags_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/git/tags{/sha}\",\"git_refs_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/git/refs{/sha}\",\"trees_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/git/trees{/sha}\",\"statuses_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/statuses/{sha}\",\"languages_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/languages\",\"stargazers_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/stargazers\",\"contributors_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/contributors\",\"subscribers_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/subscribers\",\"subscription_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/subscription\",\"commits_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/commits{/sha}\",\"git_commits_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/git/commits{/sha}\",\"comments_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/comments{/number}\",\"issue_comment_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/issues/comments{/number}\",\"contents_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/contents/{+path}\",\"compare_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/compare/{base}...{head}\",\"merges_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/merges\",\"archive_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/{archive_format}{/ref}\",\"downloads_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/downloads\",\"issues_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/issues{/number}\",\"pulls_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/pulls{/number}\",\"milestones_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/milestones{/number}\",\"notifications_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/notifications{?since,all,participating}\",\"labels_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/labels{/name}\",\"releases_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/releases{/id}\",\"deployments_url\":\"https://api.github.com/repos/Falconerd/discord-bot-github/deployments\",\"created_at\":\"2015-12-25T16:50:32Z\",\"updated_at\":\"2021-06-09T21:28:43Z\",\"pushed_at\":\"2021-06-09T13:43:01Z\",\"git_url\":\"git://github.com/Falconerd/discord-bot-github.git\",\"ssh_url\":\"git@github.com:Falconerd/discord-bot-github.git\",\"clone_url\":\"https://github.com/Falconerd/discord-bot-github.git\",\"svn_url\":\"https://github.com/Falconerd/discord-bot-github\",\"homepage\":null,\"size\":700,\"stargazers_count\":276,\"watchers_count\":276,\"language\":\"JavaScript\",\"has_issues\":true,\"has_projects\":true,\"has_downloads\":true,\"has_wiki\":true,\"has_pages\":false,\"forks_count\":127,\"mirror_url\":null,\"archived\":false,\"disabled\":false,\"open_issues_count\":22,\"license\":{\"key\":\"mit\",\"name\":\"MIT License\",\"spdx_id\":\"MIT\",\"url\":\"https://api.github.com/licenses/mit\",\"node_id\":\"MDc6TGljZW5zZTEz\"},\"forks\":127,\"open_issues\":22,\"watchers\":276,\"default_branch\":\"develop-es6\"},\"sender\":{\"login\":\"Falconerd\",\"id\":1349538,\"node_id\":\"MDQ6VXNlcjEzNDk1Mzg=\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/1349538?v=4\",\"gravata_id\":\"\",\"url\":\"https://api.github.com/users/Falconerd\",\"html_url\":\"https://github.com/Falconerd\",\"followers_url\":\"https://api.github.com/users/Falconerd/followers\",\"following_url\":\"https://api.github.com/users/Falconerd/following{/other_user}\",\"gists_url\":\"https://api.github.com/users/Falconerd/gists{/gist_id}\",\"starred_url\":\"https://api.github.com/users/Falconerd/starred{/owner}{/repo}\",\"subscriptions_url\":\"https://api.github.com/users/Falconerd/subscriptions\",\"organizations_url\":\"https://api.github.com/users/Falconerd/orgs\",\"repos_url\":\"https://api.github.com/users/Falconerd/repos\",\"events_url\":\"https://api.github.com/users/Falconerd/events{/privacy}\",\"received_events_url\":\"https://api.github.com/users/Falconerd/received_events\",\"type\":\"User\",\"site_admin\":false}";

#define IN_KEY 1
#define IN_VALUE 2
#define AFTER_KEY 3
#define AFTER_VALUE 4

Node *find_sibling(Node *node, const char *key) {
	while (node != NULL) {
		if (memcmp(node->key.data, key, node->key.length) == 0) {
			return node;
		}
		node = node->next;
	}
	return NULL;
}

// path like "hook.type"
Node *find_node(Tree tree, const char *path) {
	char *path_copy = malloc(strlen(path) * sizeof(char));
	strcpy(path_copy, path);
	char *token = strtok(path_copy, ".");
	Node *curr = tree.root->child;
	int depth = 0;
	while (token != NULL) {
		printf("%s\n", token);

		Node *found = find_sibling(curr, token);
		if (found == NULL) {
			printf("NULL\n");
			return NULL;
		} else {
			printf("found: %.*s\n", (int)found->value.length, found->value.data);
			curr = found->child;
		}

		// get next token
		token = strtok(NULL, ".");
	}
}

Tree json_to_tree(String json) {
	Tree tree = {0};

	int state = IN_KEY;
	bool in_quotes = false;
	int array_depth = 0;

	Node *root = tree_create(&tree, NULL, NULL);
	Node *parent = root;
	Node *current_node = NULL;

	if (json.data[1] != '"') {
		fprintf(stderr, "Invalid JSON\n");
		exit(-1);
	}

	current_node = tree_create(&tree, root, NULL);
	current_node->key.data = &json.data[1];

	for (int i = 1; i < json.length; ++i) {
		char *c = &json.data[i];
		switch (state) {
		case AFTER_KEY: {
			// is this a child or a sibling?
			// or an array
			if (*c == '[') {
				++current_node->value.length;
				current_node->value.data = c;
				while (*c != ']') {
					++current_node->value.length;
					++i;
					c = &json.data[i];
				}
				// skip IN_VALUE for arrays
				printf("(%p) value: %.*s\n", current_node, (int)current_node->value.length, current_node->value.data);
				state = AFTER_VALUE;
			} else if (*c == '{') {
				parent = current_node;
				state = IN_KEY;
				Node *new_node = tree_create(&tree, parent, NULL);
				current_node = new_node;
				current_node->key.data = c+1;
			} else {
				if (*c == '"') {
					in_quotes = true;
				}
				state = IN_VALUE;
				current_node->value.data = c;
			}
		} break;
		case AFTER_VALUE: {
			// are we going up a level?
			if (*c == '}') {
				parent = parent->parent;
				current_node = parent;
			} else if (*c == '"') {
				state = IN_KEY;
				Node *new_node = tree_create(&tree, parent, current_node);
				current_node = new_node;
				current_node->key.data = c;
				current_node->key.length = 1;
			}
		} break;
		case IN_KEY: {
			// find end of key
			if (*c == ':' && *(c-1) == '"') {
				state = AFTER_KEY;
				++current_node->key.data;
				current_node->key.length -= 2;
				printf("(%p) key: %.*s\n", current_node, (int)current_node->key.length, current_node->key.data);
			} else {
				++current_node->key.length;
			}
		} break;
		case IN_VALUE: {
			// go until " without a \ before it
			// go until , if not in quotes
			// go until } if not in quotes
			if (*c == '"') {
				if (*(c+1) == '\\') {
					++current_node->value.length;
				} else {
					in_quotes = false;
					state = AFTER_VALUE;
					++current_node->value.data;
					printf("(%p) value: %.*s\n", current_node, (int)current_node->value.length, current_node->value.data);
				}
			} else if (*c == ',') {
				if (in_quotes) {
					++current_node->value.length;
				} else {
					++current_node->value.length;
					state = AFTER_VALUE;
					printf("(%p) value2: %.*s\n", current_node, (int)current_node->value.length, current_node->value.data);
				}
			} else if (*c == '}') {
				if (in_quotes) {
					++current_node->value.length;
				} else {
					++current_node->value.length;
					state = AFTER_VALUE;
					printf("(%p) value3: %.*s\n", current_node, (int)current_node->value.length, current_node->value.data);
				}
			} else {
				++current_node->value.length;
			}
		} break;
		}
	}

	find_node(tree, "repository.owner.subscriptions_url");
	find_node(tree, "sender.site_admin");

	return tree;
}

void process_request(char *buffer, size_t length) {
	List list = {0};
	size_t EOL = 0;
	size_t BOL = 0;
	for (size_t i = 0; i < length; ++i) {
		if (buffer[i] == '\n' || i == length-1) {
			EOL = i;
			++i;

			// consume new lines
			while (buffer[i] == '\n' || buffer[i] == '\r') {
				++i;
			}

			// do the thing
			List_Item *line = append(&list);
			line->buffer = &buffer[BOL];
			line->length = EOL - BOL;

			BOL = i;
		}
	}

	String event_type;
	String signature;
	String payload;

	List_Item *item = list.head;
	for (;;) {
		if (item == NULL) {
			break;
		}

		// get event type
		if (memcmp(item->buffer, "X-GitHub-Event: ", 16) == 0) {
			event_type.data = &item->buffer[16];
			event_type.length = item->length - 16;
		}

		if (memcmp(item->buffer, "X-Hub-Signature-256: sha256=", 28) == 0) {
			signature.data = &item->buffer[28];
			signature.length = item->length - 28;
		}

		if (memcmp(item->buffer, "{", 1) == 0) {
			payload.data = &item->buffer[0];
			payload.length = item->length;
		}

		item = item->next;
	}

	Tree tree = json_to_tree(payload);
	find_node(tree, "hook.id");
}

void *handle_connection(void *pclient) {
	int client_socket = *((int*)pclient);
	free(pclient);
	char *buffer = malloc(sizeof(char) * (BUFFER_SIZE+1));
	char *recv_line = malloc(sizeof(char) * (BUFFER_SIZE+1));
	char *response_success = "HTTP/1.1 202 Accepted\r\n\r\n";
	char *response_failure = "HTTP/1.1 403 Forbidden\r\n\r\n";

	struct timeval tv = {0};
	tv.tv_sec = 1;
	setsockopt(client_socket, SOL_SOCKET, SO_RCVTIMEO, (struct timeval *)&tv, sizeof(struct timeval));

	memset(recv_line, 0, BUFFER_SIZE);
	memset(buffer, 0, BUFFER_SIZE);

	int chunk = 0;
	int status = 202;
	size_t offset = 0;
	int n = 0;

	while((n = read(client_socket, recv_line, BUFFER_SIZE-1)) > 0) {
		fprintf(stdout, "%s", recv_line);

		memcpy(&buffer[offset], recv_line, n);
		offset += n;

		if (0 == chunk) {
			int m = memcmp(recv_line, "POST / ", 7 * sizeof(char));
			if (0 != m) {
				status = 403;
				fprintf(stdout, "\nBad request\n");
				break;
			}
		}

		if (recv_line[n-1] == '\n') {
			break;
		}

		++chunk;
		memset(recv_line, 0, BUFFER_SIZE);
	}
	if (n < 0) {
		printf("\nread error (timeout) %d (size: %lu)\n", n, offset);
	}

	switch (status) {
	case 202: {
		write(client_socket, response_success, strlen(response_success));
	} break;
	default: {
		write(client_socket, response_failure, strlen(response_failure));
	}
	}

	process_request(buffer, offset);

	free(buffer);
	free(recv_line);
	close(client_socket);
	return NULL;
}

void *thread_function(void *arg) {
	for (;;) {
		pthread_mutex_lock(&mutex);
		int *pclient = dequeue();
		if (pclient == NULL) {
			pthread_cond_wait(&condition_var, &mutex);
			pclient = dequeue();
		}
		pthread_mutex_unlock(&mutex);
		if (pclient != NULL) {
			handle_connection(pclient);
		}
	}
}

void check(int code, const char *message) {
	if (code < 0) {
		fprintf(stderr, "Error: %s\n", message);
		exit(-1);
	}
}

int main(void) {
	int server_socket, client_socket;
	SA_IN server_addr;

	for (int i = 0; i < THREAD_POOL_SIZE-1; ++i) {
		pthread_create(&thread_pool[i], NULL, thread_function, NULL);
	}

	check((server_socket = socket(AF_INET, SOCK_STREAM, 0)), "Socket err");

	memset(&server_addr, 0, sizeof(server_addr));
	server_addr.sin_family = AF_INET;
	server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
	server_addr.sin_port = htons(PORT);

	check(bind(server_socket, (SA*)&server_addr, sizeof(server_addr)), "Bind err");
	check(listen(server_socket, SERVER_BACKLOG), "Listen err");

	for (;;) {
		printf("Waiting\n");

		client_socket = accept(server_socket, (SA*)NULL, NULL);
		int *pclient = malloc(sizeof(int));
		*pclient = client_socket;
		pthread_mutex_lock(&mutex);
		enqueue(pclient);
		pthread_cond_signal(&condition_var);
		pthread_mutex_unlock(&mutex);
	}

	return 0;
}
