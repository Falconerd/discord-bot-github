"use strict";
var CommandHandler = (function () {
    function CommandHandler() {
    }
    CommandHandler.isValid = function (input) {
        var command = input.split(" ");
        if (command[0] !== "!dbg")
            return false;
        if (!CommandHandler.commands[command[1]])
            return false;
        if (command.length > 3)
            return false;
        return true;
    };
    CommandHandler.getCommand = function (input) {
        if (CommandHandler.isValid(input)) {
            return { command: input.split(" ")[1], arguments: input.split(" ").slice(2) };
        }
        else {
            return undefined;
        }
    };
    CommandHandler.commands = {
        "add": true,
        "remove": true,
        "token": true,
        "help": true,
    };
    return CommandHandler;
}());
exports.CommandHandler = CommandHandler;
