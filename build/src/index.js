"use strict";
var discord_js_1 = require("discord.js");
var command_handler_1 = require("./command-handler");
var actions_1 = require("./actions");
var config_1 = require("./config");
var bot = new discord_js_1.Client({
    autoReconnect: true
});
bot.on("message", function (message) {
    var command = command_handler_1.CommandHandler.getCommand(message.content);
    if (command) {
        if (command.command === "add" && command.arguments.length) {
            actions_1.Actions.add(command.arguments[0], message.channel.id)
                .then(function (result) {
                bot.sendMessage(message.channel.id, "Added subscription.");
            }).catch(function (err) {
                bot.sendMessage(message.channel.id, "Error: " + err);
            });
        }
        else if (command.command === "remove" && command.arguments.length) {
            actions_1.Actions.remove(command.arguments[0], message.channel.id);
        }
        else if (command.command === "token") {
            if (command.arguments.length) {
                actions_1.Actions.addToken(command.arguments[0], message.author.id);
            }
            else {
                actions_1.Actions.removeToken(command.arguments[0], message.author.id);
            }
        }
    }
});
bot.loginWithToken(config_1.config.token);
