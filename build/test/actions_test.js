"use strict";
/// <reference path="../typings/index.d.ts" />
var mongodb_1 = require("mongodb");
var tap = require("tap");
tap.test("", function (ta) {
    mongodb_1.MongoClient.connect("mongodb://127.0.0.1:27017/mydb_test", function (err, db) {
        if (err)
            return console.log(err);
        ta.test("#add", function (t) {
            var collection = db.collection('subscriptions');
            collection.insert({ "user": "user", "repo": "repo" });
            var user = collection.find({ "user": "user " });
            console.log(">>>" + user + "<<<");
            t.end();
        });
        ta.end();
    });
});
