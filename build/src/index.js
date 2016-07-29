"use strict";
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var mongodb_1 = require("mongodb");
var discord_js_1 = require("discord.js");
var command_checker_1 = require("./command-checker");
var actions_1 = require("./actions");
var events_1 = require("./events");
var config_1 = require("./config");
var MongoClient = mongodb_1.default.MongoClient;
var bot = new discord_js_1.Client({
    autoReconnect: true
});
bot.on("message", function (message) {
    if (message.author.id === bot.user.id)
        return;
    var command = command_checker_1.CommandChecker.getCommand(message.content);
    if (command) {
        var id = (command.command === "token") ? message.author.id : message.channel.id;
        if (command.command === "help") {
            actions_1.Actions.help(bot, message.channel.id);
        }
        else {
            actions_1.Actions[command.command](command.argument, id)
                .then(function (result) {
                bot.sendMessage(message.channel.id, result);
            })
                .catch(function (err) {
                bot.sendMessage(message.channel.id, err);
            });
        }
    }
});
bot.loginWithToken(config_1.config.token, null, null, function (error) {
    if (error)
        return console.log(error);
    console.log("Logged in!");
});
var events = {};
events.commit_comment = function (data) { };
var app = express_1.default();
console.log("Do we get here?");
app.use(body_parser_1.default.json());
app.post("/", function (req, res) {
    console.log(req);
    var event = req.get("X-GitHub-Event");
    var message = events_1.Events[event](req.body);
    var repo = req.body.repository.full_name.toLowerCase();
    console.log("repo: ", repo);
    sendMessages(repo, message);
    res.send(200);
});
function sendMessages(repo, message) {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(config_1.config.db, function (err, db) {
            if (err)
                reject(err);
            db.collection("subscriptions").find({
                "repo": repo
            })
                .toArray(function (err, subscriptions) {
                console.log(subscriptions);
                for (var _i = 0, subscriptions_1 = subscriptions; _i < subscriptions_1.length; _i++) {
                    var subscription = subscriptions_1[_i];
                    if (subscription.repo === repo.toLowerCase()) {
                        console.log("Sending:", repo, message);
                        bot.sendMessage(subscription.channelId, message);
                    }
                }
                db.close();
            });
        });
    });
}
app.listen(process.env.PORT || 8080);
