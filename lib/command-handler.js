"use strict";
var https = require('https');
var CommandHandler = (function () {
    function CommandHandler(client) {
        this.client = client;
    }
    CommandHandler.prototype.receive = function (message) {
        var content = message.content.split(' ');
        var command = content[1];
        var argument = content[2];
        if (this[command]) {
            this[command](message.channel, argument);
        }
        else {
            this.help(message.channel);
        }
    };
    CommandHandler.prototype.help = function (channel) {
        this.client.sendMessage(channel, "```\nThis bot is used to get updates about GitHub projects you are working\non.\n\nBy default, new GitHub public access tokens give READ-ONLY access to your public\ndata. There is no risk of this bot changing anything in your repos.\n\nYou can read more about this on the GitHub developer's page about OAuth.\nhttps://developer.github.com/v3/oauth/#scopes\n\nUsage: !dbg <option> <argument>\n\nOptions:\n  token <token> .... add your GitHub access token (required).\n  add <repo> ....... add a new subscription to this channel.\n  delete <repo> .... delete a subscription in this channel.\n  list ............. list subscriptions for this channel.\n  help ............. display this information.\n\nExamples:\n  !dbg oauth 91293e80511083aa273d689e8a0853f636353f5f\n  !dbg add hydrabolt/discord.js\n  !dbg delete hydrabolt/discord.js\n  !dbg list\n  ```");
    };
    CommandHandler.prototype.token = function (channel, content) {
    };
    CommandHandler.prototype.add = function (channel, content) {
        var _this = this;
        https.get("https://github.com/" + content, function (res) {
            if (res.statusCode === 200) {
                _this.client.sendMessage(channel, "Listening for changes in " + content + " in this channel.");
            }
        }).on('error', function (e) {
            _this.client.sendMessage(channel, "Error: " + e.message);
        });
    };
    CommandHandler.prototype.delete = function (content) {
    };
    CommandHandler.prototype.list = function () {
    };
    return CommandHandler;
}());
exports.CommandHandler = CommandHandler;
