#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>

int main(void) {
	int socket_desc;

	socket_desc = socket(AF_INET, SOCK_STREAM, 0);
	if (-1 == socket_desc) {
		fprintf(stderr, "\x1b[031mError: could not create socket\x1b[0m\n");
	}

  	struct sockaddr_in server = {.sin_family = AF_INET, .sin_addr.s_addr = inet_addr("216.58.215.46"), .sin_port = htons(80)};

	if (connect(socket_desc, (struct sockaddr*)&server, sizeof(server)) < 0) {
		fprintf(stderr, "Error: connection failed\n");
		return 1;
	}

	fprintf(stdout, "Connected\n");

	char *request = "GET / HTTP/1.1\r\n\r\n";

	if (send(socket_desc, request, strlen(request), 0) < 0) {
		fprintf(stderr, "Error: send failed\n");
		return 1;
	}

	fprintf(stdout, "Data sent\n");

	char response[2000];

	if (recv(socket_desc, response, 2000, 0) < 0) {
		fprintf(stderr, "Error: recv failed\n");
		return 1;
	}

	fprintf(stdout, "Reply received\n");
	fprintf(stdout, "%s", response);

	close(socket_desc);

	return 0;
}
