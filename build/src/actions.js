"use strict";
var mongodb = require("mongodb");
var Promise = require("promise");
var config_1 = require("./config");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectID;
var Actions = (function () {
    function Actions() {
    }
    Actions.add = function (repo, channelId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config_1.config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("subscriptions").insertOne({
                    "repo": repo,
                    "channelId": channelId
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.close();
                    resolve(true);
                });
            });
        });
    };
    Actions.remove = function (repo, channelId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config_1.config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("subscriptions").deleteOne({
                    "repo": repo,
                    "channelId": channelId
                }, function (err, results) {
                    if (err)
                        reject(err);
                    db.close();
                    resolve(true);
                });
            });
        });
    };
    Actions.addToken = function (token, userId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config_1.config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("tokens").insertOne({
                    "userId": userId,
                    "token": token
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.close();
                    resolve(true);
                });
            });
        });
    };
    Actions.removeToken = function (token, userId) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(config_1.config.db, function (err, db) {
                if (err)
                    reject(err);
                db.collection("tokens").deleteOne({
                    "userId": userId,
                    "token": token
                }, function (err, result) {
                    if (err)
                        reject(err);
                    db.close();
                    resolve(true);
                });
            });
        });
    };
    Actions.help = function (client, channel) {
        var helpMessage = "\nUsage: !dbg <command> [value]\n\nCommands:\n  add <repo> ....... adds a subscription for the current channel\n  remove <repo> .... removes a subscription for the current channel\n  token [token] .... adds a GitHub personal access token. If no value is given,\n                     tokens linked to this user will be removed.\n  help ............. displays this text";
        client.sendMessage(channel, helpMessage, {}, function (error, message) {
            if (error)
                console.log(error);
        });
    };
    return Actions;
}());
exports.Actions = Actions;
