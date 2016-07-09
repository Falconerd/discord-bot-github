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
                    reject(false);
                db.collection("subscriptions").insertOne({
                    "repo": repo,
                    "channelId": channelId
                }, function (err, result) {
                    if (err)
                        reject(false);
                    console.log("Added a new subscription.");
                    db.close();
                    resolve(true);
                });
            });
        });
    };
    Actions.remove = function () {
        return true;
    };
    Actions.token = function () {
        return true;
    };
    Actions.help = function () {
    };
    return Actions;
}());
exports.Actions = Actions;
