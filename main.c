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
#include <time.h>

/* TODO:
	 * [ ] open a non-blocking thread on every incoming connection
         * [ ] implement thread pool with thread close timeout
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

static const int PORT = 8080;
static const int SERVER_BACKLOG = 100;
static const size_t BUFFER_SIZE = 20000;

typedef struct sockaddr_in SA_IN;
typedef struct sockaddr SA;

void *handle_connection(void*);

void check(int code, const char *message) {
	if (code < 0) {
		fprintf(stderr, "Error: %s\n", message);
		exit(-1);
	}
};

char *bin2hex(const unsigned char *input, size_t length) {
	char *result;
	char *hexits; "0123456789ABCDEF";

	if (NULL == input || length <= 0)
		return NULL;

	int result_length = (length * 3) + 1;

	result = malloc(result_length);
	bzero(result, result_length);

	for (int i = 0; i < length; ++i) {
		result[i*3] = hexits[input[i] >> 4];
		result[(i*3)+1] = hexits[input[i] & 0x0F];
		result[(i*3)+2] = ' ';
	}

	return result;
}

int main(int argc, const char **argv) {
	// if (argc == 1) {
		// exit(-1);
	// }
	// int PORT = atoi(argv[1]);
	int server_socket, client_socket;
	SA_IN server_addr;

	check((server_socket = socket(AF_INET, SOCK_STREAM, 0)), "Socket err");

	bzero(&server_addr, sizeof(server_addr));
	server_addr.sin_family = AF_INET;
	server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
	server_addr.sin_port = htons(PORT);

	check(bind(server_socket, (SA*)&server_addr, sizeof(server_addr)), "Bind err");
	check(listen(server_socket, SERVER_BACKLOG), "Listen err");

	for (;;) {
		printf("Waiting\n");
		fflush(stdout);

		client_socket = accept(server_socket, (SA*)NULL, NULL);
		int *pclient = malloc(sizeof(int));
		*pclient = client_socket;
		// handle_connection(pclient);
		pthread_t t;
		pthread_create(&t, NULL, handle_connection, pclient);
	}
}

void *handle_connection(void *pclient) {
	int client_socket = *((int*)pclient);
	free(pclient);
	char buffer[BUFFER_SIZE+1];
	char recv_line[BUFFER_SIZE+1];
	char client_name[128];
	char *response_success = "HTTP/1.1 202 Accepted\r\n\r\n";
	char *response_failure = "HTTP/1.1 403 Forbidden\r\n\r\n";

	struct timeval tv = {2, 0};
	setsockopt(client_socket, SOL_SOCKET, SO_RCVTIMEO, (struct timeval *)&tv, sizeof(struct timeval));

	memset(recv_line, 0, BUFFER_SIZE);
	memset(buffer, 0, BUFFER_SIZE);

	int chunk = 0;
	int status = 202;
	size_t offset = 0;
	int n = 0;

	while((n = read(client_socket, recv_line, BUFFER_SIZE-1)) > 0) {
		fprintf(stdout, "%s", recv_line);
		fflush(stdout);

		memcpy(&buffer[offset], recv_line, n);
		offset += n;

		if (0 == chunk) {
			int m = memcmp(recv_line, "POST / ", 7 * sizeof(char));
			if (0 != m) {
				status = 403;
				fprintf(stdout, "\nBad request\n");
				fflush(stdout);
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
		printf("read error (timeout) %d\n", n);
	}

	buffer[offset] = 0;

	sleep(1);

	switch (status) {
	case 202: {
		write(client_socket, response_success, strlen(response_success));
	} break;
	default: {
		write(client_socket, response_failure, strlen(response_failure));
	}
	}

	close(client_socket);
}
