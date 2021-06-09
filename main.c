#include <stdio.h>
#include <stdlib.h>
#include <string.h>
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

/* TODO:
         * [X] implement thread pool
         * [X] test what happens when using slow DOS attack
	 * [X] read the request body into a string
         * [ ] extract relevant data from the string
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

typedef struct queue_item Queue_Item;
struct queue_item {
	int *client_socket;
	Queue_Item *next;
};

typedef struct queue Queue;
struct queue {
	Queue_Item *head;
	Queue_Item *tail;
};

Queue queue = {0};

// we don't really care about data locality
// just use fragmented list
typedef struct list_item List_Item;
struct list_item {
	char *buffer;
	size_t length;
	List_Item *next;
};

typedef struct list List;
struct list {
	List_Item *head;
	List_Item *tail;
};

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
		if (buffer[i] == '\n') {
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
