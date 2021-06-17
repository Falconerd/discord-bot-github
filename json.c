#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stddef.h>

#define INITIAL_POOL_CAPACITY 512

typedef enum json_node_type {
	JSON_NODE_TYPE_OBJECT,
	JSON_NODE_TYPE_ARRAY,
	JSON_NODE_TYPE_STRING,
	JSON_NODE_TYPE_NUMBER,
	JSON_NODE_TYPE_BOOLEAN,
	JSON_NODE_TYPE_FLOAT
} JSON_Node_Type;

typedef struct json_array {
} JSON_Array;

typedef struct json_object {
} JSON_Object;

typedef struct json_string {
} JSON_String;

typedef struct json_number {
} JSON_Number;

typedef struct json_node_key {
	char *data;
	size_t length;
} JSON_Node_Key;

typedef union json_node_value {
	JSON_Array array;
	JSON_Object object;
	JSON_String string;
	JSON_Number number;
} JSON_Node_Value;

typedef struct json_node JSON_Node;
struct json_node {
	JSON_Node_Type type;
	JSON_Node_Key key;
	JSON_Node_Value value;
	JSON_Node *parent;
	JSON_Node *next;
};

typedef struct json_tree {
	JSON_Node *root;
} JSON_Tree;

typedef enum json_parser_state {
	JSON_PARSER_STATE_INIT,
	JSON_PARSER_STATE_IN_KEY,
	JSON_PARSER_STATE_IN_VALUE,
	JSON_PARSER_STATE_AFTER_KEY,
	JSON_PARSER_STATE_AFTER_VALUE
} JSON_Parser_State;

typedef struct json_node_pool {
	JSON_Node *start;
	size_t length;
	size_t capacity;
} JSON_Node_Pool;

typedef struct json_parser {
	JSON_Tree *tree;
	JSON_Node_Pool *pool;
	JSON_Parser_State state;
	int in_quotes;
} JSON_Parser;

// init parser with it's own arena
static JSON_Parser *json_parser_init() {
	JSON_Node_Pool *pool = malloc(sizeof(JSON_Node) * INITIAL_POOL_CAPACITY);
}

// grab from arena, expand if required
// always realloc to straight block
static JSON_Node *source(JSON_Parser *parser) {
}

static void json_print_char(JSON_Parser_State state, char c) {
	switch (state) {
	case JSON_PARSER_STATE_INIT: {
		printf("\x1b[36m%c\x1b[0m", c);
	} break;
	case JSON_PARSER_STATE_IN_KEY: {
		printf("\x1b[31m%c\x1b[0m", c);
	} break;
	case JSON_PARSER_STATE_IN_VALUE: {
		printf("\x1b[33m%c\x1b[0m", c);
	} break;
	case JSON_PARSER_STATE_AFTER_KEY: {
		printf("\x1b[32m%c\x1b[0m", c);
	} break;
	case JSON_PARSER_STATE_AFTER_VALUE: {
		printf("\x1b[35m%c\x1b[0m", c);
	} break;
	}
}

JSON_Tree *json_parse(char *string, size_t length) {
	JSON_Parser *parser = json_parser_init();

	for (size_t i = 0; i < length; ++i) {
		char *c = &string[i];
		if (*c == '{') {
		}
	}
	return parser->tree;
}

void json_free(JSON_Tree *tree) {}

int main(void) {

	char *input = "{\"number\":1234}";

	json_parse(input, strlen(input));
	printf("\nDone.\n");

	return 0;
}
