"use strict";
var discord_js_1 = require("discord.js");
var command_handler_1 = require("./command-handler");
var actions_1 = require("./actions");
var config_1 = require("./config");
var bot = new discord_js_1.Client({
    autoReconnect: true
});
bot.on("message", function (message) {
    if (message.author.id === bot.user.id)
        return;
    var command = command_handler_1.CommandHandler.getCommand(message.content);
    if (command) {
        var id = (command.command === "token") ? message.author.id : message.channel.id;
        if (command.command !== "help") {
            return actions_1.Actions[command.command](command.argument, id)
                .then(function (result) {
                bot.sendMessage(message.channel.id, result);
            })
                .catch(function (err) {
                bot.sendMessage(message.channel.id, err);
            });
        }
    }
    actions_1.Actions.help(bot, message.channel.id);
});
bot.loginWithToken(config_1.config.token);
