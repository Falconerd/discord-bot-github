'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var express = _interopDefault(require('express'));
var bodyParser = _interopDefault(require('body-parser'));
var discord_js = require('discord.js');

var CommandChecker = (function () {
    function CommandChecker() {
    }
    CommandChecker.isValid = function (input) {
        var command = input.split(" ");
        if (command[0] !== "!dbg")
            return false;
        if (!CommandChecker.commands[command[1]])
            return false;
        if (command.length > 3)
            return false;
        return true;
    };
    CommandChecker.getCommand = function (input) {
        if (CommandChecker.isValid(input)) {
            return { command: input.split(" ")[1], argument: input.split(" ")[2] };
        }
        else {
            return undefined;
        }
    };
    CommandChecker.commands = {
        "add": true,
        "remove": true,
        "token": true,
        "help": true,
    };
    return CommandChecker;
}());

var config = (function () {
    function config() {
    }
    config.db = "mongodb://discobot:amn4apwet@ds021994.mlab.com:21994/discobot";
    config.token = "MTkzMDAwNDQzOTgxNDYzNTUy.CnA48g.r4ZawiPPPE4gXRSpSzBQdRBffiE";
    return config;
}());

var MongoClient = mongodb.MongoClient;
var Actions = (function () {
    function Actions() {
    }
    Actions.add = function (repo, channelId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("subscriptions").deleteMany({
                    "repo": repo,
                    "channelId": channelId
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.collection("subscriptions").insertOne({
                        "repo": repo,
                        "channelId": channelId
                    }, function (err, result) {
                        if (err)
                            reject(err);
                        db.close();
                        resolve("Successfully added a new subscription. " + repo + " <-> " + channelId);
                    });
                });
            });
        });
    };
    Actions.remove = function (repo, channelId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("subscriptions").deleteOne({
                    "repo": repo,
                    "channelId": channelId
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.close();
                    resolve("Successfuly removed a subscription. " + repo + " </> " + channelId);
                });
            });
        });
    };
    Actions.token = function (token, userId) {
        if (token) {
            Actions.addToken(token, userId);
        }
        else {
            Actions.removeToken(token, userId);
        }
    };
    Actions.addToken = function (token, userId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("tokens").deleteMany({
                    "userId": userId,
                    "token": token
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.collection("tokens").insertOne({
                        "userId": userId,
                        "token": token
                    }, function (err, result) {
                        if (err)
                            reject(err);
                        db.close();
                        resolve("Successfully added a token.");
                    });
                });
            });
        });
    };
    Actions.removeToken = function (token, userId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("tokens").deleteOne({
                    "userId": userId,
                    "token": token
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.close();
                    resolve("Successfully removed a token.");
                });
            });
        });
    };
    Actions.help = function (client, channelId) {
        var helpMessage = "```\nUsage: !dbg <command> [value]\n\nCommands:\n  add <repo> ....... adds a subscription for the current channel\n  remove <repo> .... removes a subscription for the current channel\n  token [token] .... adds a GitHub personal access token. If no value is given, tokens linked to this user will be removed.\n  help ............. displays this text```";
        client.sendMessage(channelId, helpMessage);
    };
    return Actions;
}());

var bot = new discord_js.Client({
    autoReconnect: true
});
bot.on("message", function (message) {
    if (message.author.id === bot.user.id)
        return;
    var command = CommandChecker.getCommand(message.content);
    if (command) {
        var id = (command.command === "token") ? message.author.id : message.channel.id;
        if (command.command !== "help") {
            return Actions[command.command](command.argument, id)
                .then(function (result) {
                bot.sendMessage(message.channel.id, result);
            })
                .catch(function (err) {
                bot.sendMessage(message.channel.id, err);
            });
        }
    }
    Actions.help(bot, message.channel.id);
});
bot.loginWithToken(config.token, null, null, function (error) {
    if (error)
        return console.log(error);
});
var app = express();
app.use(bodyParser.json());
app.post("/", function (req, res) {
    console.log(req.body);
});
app.listen(8080);