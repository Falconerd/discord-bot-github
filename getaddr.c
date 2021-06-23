#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>

#define SERVER_PORT 443
#define MAXLINE 4096

int main(void) {
	struct addrinfo *result;
	struct addrinfo *res;
	int error;
	char hostname[NI_MAXHOST];

	error = getaddrinfo("gateway.discord.gg", NULL, NULL, &result);
	if (error != 0) {
		if (error = EAI_SYSTEM) {
			perror("getaddrinfo");
		} else {
			fprintf(stderr, "error getaddrinfo: %s\n", gai_strerror(error));
		}
		exit(EXIT_FAILURE);
	}

	for (res = result; res != NULL; res = res->ai_next) {
		memset(hostname, 0, NI_MAXHOST);
		error = getnameinfo(res->ai_addr, res->ai_addrlen, hostname, NI_MAXHOST, NULL, 0, 0);
		if (error != 0) {
			fprintf(stderr, "error in getnameinfo: %s\n", gai_strerror(error));
			continue;
		}
		if (*hostname != '\0') {
			printf("hostname: %s\n", hostname);
		}
	}

	freeaddrinfo(result);

	// -------------------------------------

	struct sockaddr_in servaddr;

	int sockfd = socket(AF_INET, SOCK_STREAM, 0);
	if (sockfd < 0) {
		fprintf(stderr, "error in socket\n");
		exit(EXIT_FAILURE);
	}
	memset(&servaddr, 0, sizeof(servaddr));
	servaddr.sin_family = AF_INET;
	servaddr.sin_port = htons(SERVER_PORT);

	if (inet_pton(AF_INET, hostname, &servaddr.sin_addr) <= 0) {
		fprintf(stderr, "inet_pton error\n");
		exit(EXIT_FAILURE);
	}

	if (connect(sockfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) < 0) {
		fprintf(stderr, "failed to connect\n");
		exit(EXIT_FAILURE);
	}

	char sendline[100] = {0};
	char recvline[100] = {0};
	int n;

	printf("Connected...\n");
	sprintf(sendline, "GET /?v=9&encoding=json HTTP/1.1\r\n\r\n");
	size_t sendbytes = strlen(sendline);

	if (write(sockfd, sendline, sendbytes) != sendbytes) {
		fprintf(stderr, "write error\n");
		exit(EXIT_FAILURE);
	}

	while ((n = read(sockfd, recvline, MAXLINE - 1)) > 0) {
		printf("%s", recvline);
	}

	if (n < 0) {
		fprintf(stderr, "read error\n");
		exit(EXIT_FAILURE);
	}

	return 0;
}
