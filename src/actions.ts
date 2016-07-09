import mongodb = require("mongodb");
import Promise = require("promise");
import {Client} from "discord.js";
import {config} from "./config";

const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectID;

export class Actions {
  static add(repo: string, channelId: string): any {
    return new Promise<boolean>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(false);
        db.collection("subscriptions").insertOne({
          "repo": repo,
          "channelId": channelId
        }, function(err, result) {
          if (err) reject(false);
          console.log("Added a new subscription.");
          db.close();
          resolve(true);
        });
      });
    });
  }

  static remove(repo: string, channelId: string): any {
    return new Promise<boolean>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(false);
        db.collection("subscriptions").deleteOne({
          "repo": repo,
          "channelId": channelId
        }, function(err, results) {
          if (err) reject(false);
          db.close();
          resolve(true);
        });
      });
    });
  }

  static token(userId: string, token: string): any {
    return new Promise<boolean>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(false);
        db.collection("tokens").insertOne({
          "userId": userId,
          "token": token
        }, function(err, result) {
          if (err) reject(false);
          console.log("Added a new token.");
          db.close();
          resolve(true);
        });
      });
    });
  }

  static help(client: Client, channel: string) {
    const helpMessage: string = `
Usage: !dbg <command> [value]

Commands:
  add <repo> ....... adds a subscription for the current channel
  remove <repo> .... removes a subscription for the current channel
  token [token] .... adds a GitHub personal access token. If no value is given,
                     tokens linked to this user will be removed.
  help ............. displays this text`;
    client.sendMessage(channel, helpMessage, {}, function(error, message) {
      if (error) console.log(error);
    });
  }
}
