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
 * [X] extract relevant data from the string
 * [X] print what the discord message would be
 * [X] timeout after N seconds

 * [ ] implement HMAC SHA-256
 * [ ] check github signature

 * [ ] connect to discord with a bot authentication
 * [ ] copy mongodb subscriptions into a json file
 * [ ] remove all duplicates
 * [X] read db into memory on startup
 * [ ] create query function into db
 * [ ] write all action responses
 * [ ] discord command for adding repo
 	 * [ ] check for duplicates
 	 * [ ] always use secret for private repos
 * [ ] discord command for removing repo
 * [ ] remove all unecessary printing
 * [ ] create log files
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

	// Tree tree = json_to_tree(payload);
	// find_node(tree, "hook.id");
}

void *handle_connection(void *pclient) {
	int client_socket = *((int*)pclient);
	free(pclient);
	char *buffer = calloc(BUFFER_SIZE + 1, 1);
	char *recv_line = calloc(BUFFER_SIZE + 1, 1);
	char *response_success = "HTTP/1.1 202 Accepted\r\n\r\n";
	char *response_failure = "HTTP/1.1 403 Forbidden\r\n\r\n";

	struct timeval tv = {0};
	tv.tv_sec = 1;
	setsockopt(client_socket, SOL_SOCKET, SO_RCVTIMEO, (struct timeval *)&tv, sizeof(struct timeval));

	int chunk = 0;
	int status = 202;
	size_t offset = 0;
	int n = 0;

	while((n = read(client_socket, recv_line, BUFFER_SIZE-1)) > 0) {
		fprintf(stdout, "%s", recv_line);

		memcpy(&buffer[offset], recv_line, n);
		offset += n;

		if (0 == chunk) {
			int m = memcmp(recv_line, "POST / ", 7);
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

static char *branch_from_ref(json_t const *ref) {
	char *branch = strrchr(json_getValue(ref), '/');
	return ++branch;
}

static void commit_comment_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *commit = json_getPropertyValue(json_getProperty(json, "comment"), "commit_id");
	const char *user = json_getPropertyValue(json_getProperty(json_getProperty(json, "comment"), "user"), "login");
	const char *body = json_getPropertyValue(json_getProperty(json, "comment"), "body");
	const char *fmt = "[**%s _%.*s_**] New comment on commit by %s\n%s\n";
	size_t len = strlen(repo) + 7 + strlen(user) + strlen(body) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, 7, commit, user, body);
	*message = buffer;
}

static void create_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *type = json_getPropertyValue(json, "ref_type");
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *user = json_getPropertyValue(json_getProperty(json, "sender"), "login");
	const char *ref = json_getPropertyValue(json, "ref");
	const char *fmt = "[**%s**] %s created a %s: %s\n";
	size_t len = strlen(repo) + strlen(type) + strlen(user) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, user, type, ref);
	*message = buffer;
}

static void delete_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *type = json_getPropertyValue(json, "ref_type");
	const char *user = json_getPropertyValue(json_getProperty(json, "sender"), "login");
	const char *ref = json_getPropertyValue(json, "ref");
	const char *fmt = "[**%s**] %s deleted a %s: %s\n";
	size_t len = strlen(repo) + strlen(type) + strlen(user) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, user, type, ref);
	*message = buffer;
}

static void fork_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *fork = json_getPropertyValue(json_getProperty(json, "forkee"), "full_name");
	const char *fmt = "[**%s**] -> *%s*\nForm created.\n";
	size_t len = strlen(repo) + strlen(fork) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, fork);
	*message = buffer;
}

static void gollum_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *user = json_getPropertyValue(json_getProperty(json, "sender"), "login");
	const json_t const *page_list = json_getProperty(json, "pages");

	const char *fmt = "[**%s**] Wiki was updated by %s\n";
	size_t buffer_size = strlen(fmt) + strlen(repo) + strlen(user) + 1;
	buffer = calloc(buffer_size, 1);

	json_t const *page;
	for (page = json_getChild(page_list); page != 0; page = json_getSibling(page)) {
		char *page_buffer = NULL;
		const char *title = json_getPropertyValue(page, "title");
		const char *action = json_getPropertyValue(page, "action");
		const char *page_fmt = "**%s:** %s\n";
		size_t len = strlen(title) + strlen(action) + strlen(page_fmt) + 1;
		page_buffer = calloc(len, 1);
		sprintf(page_buffer, page_fmt, title, action);
		buffer_size += len;
		buffer = realloc(buffer, buffer_size);
		strcat(buffer, page_buffer);
		free(page_buffer);
	}
	*message = buffer;
}

static void issue_comment_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *user = json_getPropertyValue(json_getProperty(json_getProperty(json, "comment"), "user"), "login");
	const char *url = json_getPropertyValue(json_getProperty(json, "comment"), "html_url");
	const char *body = json_getPropertyValue(json_getProperty(json, "comment"), "body");
	const char *title = json_getPropertyValue(json_getProperty(json, "issue"), "title");
	const char *fmt = "[**%s**] Comment created on issue: %s by %s\n<%s>\n%s\n";
	size_t len = strlen(repo) + strlen(user) + strlen(url) + strlen(body) + strlen(title) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, title, user, url, body);
	*message = buffer;
}

static void issues_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *action = json_getPropertyValue(json, "action");
	const char *user = json_getPropertyValue(json_getProperty(json, "sender"), "login");
	const char *url = json_getPropertyValue(json_getProperty(json, "issue"), "html_url");
	const char *fmt = "[**%s**] Issue %s by %s\n<%s>\n";
	size_t len = strlen(repo) + strlen(user) + strlen(url) + strlen(url) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, action, user, url);
	*message = buffer;
}

static void member_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *user = json_getPropertyValue(json_getProperty(json, "member"), "login");
	const char *url = json_getPropertyValue(json_getProperty(json, "member"), "html_url");
	const char *fmt = "[**%s**] New collaborator added: %s\n<%s>\n";
	size_t len = strlen(repo) + strlen(user) + strlen(url) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, user, url);
	*message = buffer;
}

static void public_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *fmt = "[**%s**] Has been made open source!\n";
	size_t len = strlen(repo) + strlen(fmt);
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo);
	*message = buffer;
}

static void pull_request_review_comment_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *action = json_getPropertyValue(json, "action");
	const char *user = json_getPropertyValue(json_getProperty(json_getProperty(json, "comment"), "user"), "login");
	const char *body = json_getPropertyValue(json_getProperty(json, "comment"), "body");
	const char *url = json_getPropertyValue(json_getProperty(json, "comment"), "html_url");
	const char *fmt = "[**%s**] Pull request comment %s by %s:\n%s\n%s\n";
	size_t len = strlen(repo) + strlen(body) + strlen(action) + strlen(user) + strlen(url) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, action, user, body, url);
	*message = buffer;
}

static void pull_request_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *action = json_getPropertyValue(json, "action");
	const char *user = json_getPropertyValue(json_getProperty(json, "sender"), "login");
	const char *body = json_getPropertyValue(json_getProperty(json, "pull_request"), "body");
	const char *url = json_getPropertyValue(json_getProperty(json, "pull_request"), "html_url");
	const char *fmt = "[**%s**] Pull request %s by %s:\n%s\n%s\n";
	size_t len = strlen(repo) + strlen(body) + strlen(action) + strlen(user) + strlen(url) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, action, user, body, url);
	*message = buffer;
}

static void push_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *branch = branch_from_ref(json_getProperty(json, "ref"));
	const json_t const *commit_list = json_getProperty(json, "commits");

	int count = 0;
	json_t const *commit;
	for (commit = json_getChild(commit_list); commit != 0; commit = json_getSibling(commit), ++count);
	char *tmp[20] = {0};
	sprintf(tmp, "%d", count);
	size_t count_length = strlen(tmp);

	if (count == 0) {
		const char *pusher_name = json_getPropertyValue(json_getProperty(json, "pusher"), "name");
		const char *compare = json_getPropertyValue(json, "compare");
		const char *fmt = "[**%s:%s**] push by %s\n<%s>\n";
		size_t len = strlen(repo) + strlen(branch) + strlen(pusher_name) + strlen(fmt) + 1;
		buffer = calloc(len, 1);
		sprintf(buffer, fmt, repo, branch, pusher_name, compare);
		*message = buffer;
		return;
	}

	if (count == 1) {
		commit = json_getChild(commit_list);
		const char *name = json_getPropertyValue(json_getProperty(commit, "author"), "name");
		const char *commit_message = json_getPropertyValue(commit, "message");
		const char *id = json_getPropertyValue(commit, "id");
		const char *fmt = "[**%s:%s**] 1 new commit by %s\n%s\n<https://github.com/%s/commit/%.*s>\n";
		size_t len = strlen(name) + strlen(commit_message) + 7 + strlen(fmt) + 1;
		buffer = calloc(len, 1);
		sprintf(buffer, fmt, repo, branch, name, commit_message, repo, 7, id);
		*message = buffer;
		return;
	} 


	const char *fmt = "[**%s:%s**] %d new commits\n";
	size_t buffer_size = strlen(fmt) + strlen(repo) + strlen(branch) + count_length + 1;
	buffer = malloc(buffer_size);
	sprintf(buffer, fmt, repo, branch, count);
	for (commit = json_getChild(commit_list); commit != 0; commit = json_getSibling(commit)) {
		char *commit_buffer = NULL;
		const char *name = json_getPropertyValue(json_getProperty(commit, "author"), "name");
		const char *commit_message = json_getPropertyValue(commit, "message");
		const char *id = json_getPropertyValue(commit, "id");
		const char *commit_fmt = "%s - %s <https://github.com/%s/commit/%.*s>\n";
		size_t len = strlen(name) + strlen(commit_message) + strlen(repo) + 7 + strlen(commit_fmt) + 1;
		commit_buffer = calloc(len, 1);
		sprintf(commit_buffer, commit_fmt, commit_message, name, repo, 7, id);
		buffer_size += len;
		buffer = realloc(buffer, buffer_size);
		strcat(buffer, commit_buffer);
		free(commit_buffer);
	}
	*message = buffer;
}

static void release_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *user = json_getPropertyValue(json_getProperty(json_getProperty(json, "release"), "author"), "login");
	const char *url = json_getPropertyValue(json_getProperty(json, "release"), "html_url");
	const char *fmt = "[**%s**] Release published by %s:\n<%s>\n";
	size_t len = strlen(repo) + strlen(user) + strlen(url) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, user, url);
	*message = buffer;
}

static void status_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *sha = json_getPropertyValue(json, "sha");
	const char *state = json_getPropertyValue(json, "state");
	const char *fmt = "[**%s**] commit %.*s state updated to %s\n<https://github.com/%s/commit/%.*s>\n";
	size_t len = strlen(repo) + 7 + strlen(state) + strlen(repo) + 7 + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, 7, sha, state, repo, 7, sha);
	*message = buffer;
}

static void watch_message(char **message, json_t const *json) {
	char *buffer = NULL;
	const char *repo = json_getPropertyValue(json_getProperty(json, "repository"), "full_name");
	const char *user = json_getPropertyValue(json_getProperty(json, "sender"), "login");
	const char *fmt = "[**%s**] Starred by %s\n";
	size_t len = strlen(repo) + strlen(user) + strlen(fmt) + 1;
	buffer = calloc(len, 1);
	sprintf(buffer, fmt, repo, user);
	*message = buffer;
}

int read_file_into_buffer(char **str, const char *path) {
	FILE *fp = fopen(path, "rb");
	if (fp == NULL) {
		fprintf(stderr, "Cannot open file: %s\n", path);
		exit(-1);
	}
	if (fseek(fp, 0, SEEK_END) != 0) {
		fprintf(stderr, "Cannot seek file: %s\n", path);
		exit(-1);
	}
	size_t len = ftell(fp);
	char *buf = malloc(len + 1);
	fseek(fp, 0, SEEK_SET);
	fread(buf, 1, len, fp);
	buf[len] = 0;
	fclose(fp);
	printf("%s", buf);
	*str = buf;
	return len;
}

typedef enum event_type {
	EVENT_TYPE_COMMIT_COMMENT,
	EVENT_TYPE_CREATE,
	EVENT_TYPE_DELETE,
	EVENT_TYPE_FORK,
	EVENT_TYPE_GOLLUM,
	EVENT_TYPE_ISSUE_COMMENT,
	EVENT_TYPE_ISSUES,
	EVENT_TYPE_MEMBER,
	EVENT_TYPE_PUBLIC,
	EVENT_TYPE_PULL_REQUEST_REVIEW_COMMENT,
	EVENT_TYPE_PULL_REQUEST,
	EVENT_TYPE_PUSH,
	EVENT_TYPE_RELEASE,
	EVENT_TYPE_STATUS,
	EVENT_TYPE_WATCH
} Event_Type;

static int handle_message(char **message, json_t const *json, Event_Type type) {
	switch (type) {
	case EVENT_TYPE_COMMIT_COMMENT: commit_comment_message(message, json); break;
	case EVENT_TYPE_CREATE: create_message(message, json); break;
	case EVENT_TYPE_DELETE: delete_message(message, json); break;
	case EVENT_TYPE_FORK: fork_message(message, json); break;
	case EVENT_TYPE_GOLLUM: gollum_message(message, json); break;
	case EVENT_TYPE_ISSUE_COMMENT: issue_comment_message(message, json); break;
	case EVENT_TYPE_ISSUES: issues_message(message, json); break;
	case EVENT_TYPE_MEMBER: member_message(message, json); break;
	case EVENT_TYPE_PUBLIC: public_message(message, json); break;
	case EVENT_TYPE_PULL_REQUEST_REVIEW_COMMENT: pull_request_review_comment_message(message, json); break;
	case EVENT_TYPE_PULL_REQUEST: pull_request_message(message, json); break;
	case EVENT_TYPE_PUSH: push_message(message, json); break;
	case EVENT_TYPE_RELEASE: release_message(message, json); break;
	case EVENT_TYPE_STATUS: status_message(message, json); break;
	case EVENT_TYPE_WATCH: watch_message(message, json); break;
	}
	return 0;
}

static int hostname_to_ip(char *ip, const char *hostname) {
	struct addrinfo;
	struct hostent *he;
	struct in_addr **addr_list;
	int i;

	if ((he = gethostbyname(hostname)) == NULL) {
		herror("gethostbyname");
		return -1;
	}

	addr_list = (SA_IN**)he->h_addr_list;

	for (i = 0; addr_list[i] != NULL; ++i) {
		strcpy(ip, inet_ntoa(*addr_list[i]));
		// return 0;
	}

	return 1;
}

int main(void) {
	// char *str = NULL;
	// read_file_into_buffer(&str, "tests/status.json");

	// json_t mem[512];
	// json_t const *json = json_create(str, mem, sizeof(mem) / sizeof(*mem));
	// if (!json) {
	// 	fprintf(stderr, "Could not create json\n");
	// 	return -1;
	// }

	// char *message = NULL;
	// Event_Type event_type = EVENT_TYPE_STATUS;
	// handle_message(&message, json, event_type);
	// printf("%s", message);

	// char *db = NULL;
	// read_file_into_buffer(&db, "db.json");

	// json_t const *db_json = json_create(db, mem, sizeof(mem) / sizeof(*mem));
	// if (!json) {
	// 	fprintf(stderr, "Could not create json\n");
	// 	return -1;
	// }

	// free(db);
	// free(str);
	// free(message);

	// return 0;
// #define P 443	
// #define ML 4096

// 	int sockfd = socket(AF_INET, SOCK_STREAM, 0);
// 	SA_IN addr = {0};
// 	addr.sin_family = AF_INET;
// 	addr.sin_port = htons(P);

// 	return 0;


	char *hostname = "localhost";
	char ip[100];

	hostname_to_ip(hostname, ip);
	printf("%s resolved to %s\n", hostname, ip);

	return 0;

	int server_socket, client_socket;
	SA_IN server_addr = {0};

	for (int i = 0; i < THREAD_POOL_SIZE-1; ++i) {
		pthread_create(&thread_pool[i], NULL, thread_function, NULL);
	}

	check((server_socket = socket(AF_INET, SOCK_STREAM, 0)), "Socket err");

	// memset(&server_addr, 0, sizeof(server_addr));
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
