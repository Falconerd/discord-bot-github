"use strict";
var tap = require("tap");
var command_handler_1 = require("../src/command-handler");
tap.ok(new command_handler_1.CommandHandler); // Wow, seriously?
tap.test("#isValid", function (t) {
    t.type(command_handler_1.CommandHandler.isValid("asdf"), "boolean", "Expect boolean");
    t.ok(command_handler_1.CommandHandler.isValid("!dbg add user/repo"), "Expect true as this command is valid");
    t.notOk(command_handler_1.CommandHandler.isValid("woobaga"), "Expect false as this command doesn't start with !dbg");
    t.notOk(command_handler_1.CommandHandler.isValid("!dbg sad"), "Expect false as the command 'sad' does not exist");
    t.notOk(command_handler_1.CommandHandler.isValid("!dbg add asd ffff"), "Expect false as there are too many commands/options");
    t.end();
});
tap.test("#getCommand", function (t) {
    t.type(command_handler_1.CommandHandler.getCommand("asdf"), "undefined", "Expect undefined as 'asdf' is not a command");
    t.match(command_handler_1.CommandHandler.getCommand("!dbg add user/repo"), "add", "Expect 'add' as this command is valid");
    t.end();
});
