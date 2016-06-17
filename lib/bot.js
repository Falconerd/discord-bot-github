"use strict";
var discord_js_1 = require('discord.js');
var command_handler_1 = require('./command-handler');
var config = require('../config');
var client = new discord_js_1.Client({
    token: config.token,
    autorun: true,
});
var commandHandler = new command_handler_1.CommandHandler(client);
client.on('ready', function () {
    console.log("Logged in as " + client.user.username + " - (" + client.user.id + ")");
});
client.on('message', function (message) {
    if (message.content.substring(0, 4) === '!dbg') {
        commandHandler.receive(message);
    }
});
client.loginWithToken(config.token);
