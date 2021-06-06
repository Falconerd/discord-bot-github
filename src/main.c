/*
 * 1. authenticate on Discord
 * 2. listen for evevnts. What are they?
 */

#include <time.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <stdbool.h>

// Berkeley sockets, so assumes POSIX compliant OS //
#include <netdb.h>                                 //
#include <arpa/inet.h>                             //
#include <sys/socket.h>                            //
#include <netinet/in.h>                            //
/////////////////////////////////////////////////////

//html file related definitions
FILE* html_file;
char* buffer;
u_int64_t number_of_bytes;

//response is http response message; contents of the html file will be added to response
char response[] = "HTTP/1.1 202 Accepted\r\n"
"Content-Type: application/json; charset=UTF-8\r\n\r\n"
"{\"statusCode\": \"202\",\"description\":\"Accepted\"}";

typedef struct string {
	char *buffer;
	size_t length;
} String;

static String get_line(char *buffer) {
	String line = {buffer};
	for (size_t i = 0; i < strlen(buffer); ++i) {
		if ('\n' == buffer[i]) {
			line.length = i;
			break;
		}
	}
	return line;
}

typedef enum request_type {
	GET,
	POST,
	PUT,
	PATCH,
	DELETE
} Request_Type;

typedef struct request {
	Request_Type type;
	String data;
} Request;

Request request_from_buffer() {
}

void handle_request(char *request_buffer) {
	// Do nothing on non-post requests
	if (!memcmp(request_buffer, "POST", 4)) {
		return;
	}
}

int main(int argc, char** argv) {
    //Socket related definitions
    int32_t server_fd, new_socket;
    int32_t address_length = sizeof(struct sockaddr_in);
    static const u_int16_t PORT = 8080;
    
    //free(buffer);

    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("\x1b[31mEncountered an error in socket()\x1b[0m");
        exit(EXIT_FAILURE);
    }

    // Standard setup code for POSIX sockets
    struct sockaddr_in address = {.sin_family = AF_INET, .sin_addr.s_addr = INADDR_ANY, .sin_port = htons(PORT)};

    memset(address.sin_zero, '\0', sizeof(address.sin_zero));

    if (bind(server_fd, (struct sockaddr* )&address, sizeof(address)) < 0) {
        perror("\x1b[31mEncountered an error in bind()\x1b[0m");
        exit(EXIT_FAILURE);
    }

    if (listen(server_fd, 10) < 0) {
        perror("\x1b[31mEncountered an error in listen()\x1b[0m");
        exit(EXIT_FAILURE);
    }


    for (;;) {
        printf("\x1b[33mListening for incoming requests ...\n\x1b[0m\n");
       
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&address_length))<0) {
            perror("\x1b[31mEncountered an error in accept()\x1b[0m");
            exit(EXIT_FAILURE);
        }

        time_t now = time(0);
        printf("begin: %u\n", now);

	// Always return 200
	// TODO: Figure out how to make reading requests faster
	// so that they don't time out and response can be moved
	// to after the request is handled
        write(new_socket, response, strlen(response)); //sends response to the client
        printf("\x1b[32mSent a response\x1b[0m\n\n");

	// our largest request size is ... ?? 9828
	char request_buffer[20000] = {0};
        char request_part_buffer[20000] = {0}; 
        size_t start = 0;
        size_t len;
        int i = 0;
        // It seems requests come chunked into parts of 1-3 kbytes
        while ((len = read(new_socket, request_part_buffer, 20000)) > 0) {
	        now = time(0);
	        printf("during [%d] %u\n", i++, now);
	        memcpy(request_buffer+start, request_part_buffer, len);
	        start += len;
        }
        // printf("\x1b[36mReceived a request:\x1b[0m\n%.*s\n", 20000, request_buffer);
        // handle_request(request_buffer);

        now = time(0);
        printf("end: %u\n", now);
        
        close(new_socket);

    }

    return 0;

}
