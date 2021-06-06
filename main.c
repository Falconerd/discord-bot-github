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

/* TODO:
	 * open a non-blocking thread on every incoming connection
	 * read the request body into a string
         * extract relevant data from the string
         * print what the discord message would be

         * connect to discord with a bot authentication
         * create a hash table to store all subscriptions
         * copy mongodb subscriptions into a file
         * create the flat file db format
		 * falconerd/game XXXXXXX XXXXXXX XXXXXXX
		 * where each XXXXXXX is a channelId, and each line is a hashtable entry
         * read db into memory on startup
         * create query function into db
         * write all action responses
 */

static int PORT = 8080;

static pthread_mutex_t printf_mutex;

static void sync_printf(const char *fmt, ...) {
	va_list args;
	va_start(args, fmt);

	pthread_mutex_lock(&printf_mutex);
	vprintf(fmt, args);
	pthread_mutex_unlock(&printf_mutex);

	va_end(args);
}

static void *connection_handler(void *);

int main(void) {
	pthread_mutex_init(&printf_mutex, NULL);
	int socket_desc, new_socket, c, *new_sock;
	struct sockaddr_in server, client;
	char response[] = "HTTP/1.1 202 Accepted\r\n"
		"Content-Type: application/json; charset=UTF-8\r\n\r\n"
		"{\"statusCode\": \"202\",\"description\":\"Accepted\"}";

	socket_desc = socket(AF_INET, SOCK_STREAM, 0);
	if (-1 == socket_desc) {
		fprintf(stderr, "\x1b[031mError: could not create socket\x1b[0m\n");
		return 1;
	}

  	server.sin_family = AF_INET;
  	server.sin_addr.s_addr = INADDR_ANY;
  	server.sin_port = htons(PORT);

  	if (bind(socket_desc, (struct sockaddr*)&server, sizeof(server)) < 0) {
	  	fprintf(stderr, "Error: bind failed\n");
	  	return 1;
  	}
  	fprintf(stdout, "Bound to port: %d\n", PORT);

  	listen(socket_desc, 3);

  	fprintf(stdout, "Waiting for incoming connections...\n");
  	c = sizeof(struct sockaddr_in);
  	while (new_socket = accept(socket_desc, (struct sockaddr *)&client, (socklen_t*)&c)) {
	  	fprintf(stdout, "Connection accepted\n");
	  	write(new_socket, response, strlen(response));

	  	pthread_t sniffer_thread;
	  	new_sock = malloc(1);
	  	*new_sock = new_socket;

	  	if (pthread_create(&sniffer_thread, NULL, connection_handler, (void*) new_sock) < 0) {
		  	perror("Could not create thread\n");
		  	return 1;
	  	}

	  	fprintf(stdout, "Handler assigned\n");
	  	close(new_socket);
  	}

  	if (new_socket < 0) {
	  	perror("\x1b[031mAccept failed\x1b[0m\n");
	  	return 1;
  	}

	return 0;
}

void *connection_handler(void *socket_desc) {
	int sock = *(int*)socket_desc;
	char *message = "Connection handler go brrr\n";
	write(sock, message, strlen(message));

	fcntl(sock, F_SETFL, O_NONBLOCK);

	char tmp[20000];
	read(sock, tmp, 20000);
  	fprintf(stdout, "%s", tmp);

	  	// char buf[20000];
	  	// char tmp[20000];
	  	// size_t at = 0;
	  	// for (int i = 0; i < 5; ++i) {
		  // 	size_t x = read(sock, tmp, 20000);
		  // 	memcpy(buf+at, tmp, x);
		  // 	at += x;
	  	// }
	  	// fprintf(stdout, "%.*s", at, buf);

	free(socket_desc);
	return 0;
}
