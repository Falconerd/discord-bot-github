import mongodb = require("mongodb");
import Promise = require("promise");
import {Client} from "discord.js";
import {config} from "./config";

const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectID;

export class Actions {
  static add(repo: string, channelId: string): any {
    return new Promise<any>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(err);
        db.collection("subscriptions").deleteMany({
          "repo": repo,
          "channelId": channelId
        }, function(err, result) {
          if (err) reject(err);
          db.collection("subscriptions").insertOne({
            "repo": repo,
            "channelId": channelId
          }, function(err, result) {
            if (err) reject(err);
            db.close();
            resolve(`Successfully added a new subscription. ${repo} <-> ${channelId}`);
          });
        });
      });
    });
  }

  static remove(repo: string, channelId: string): any {
    return new Promise<any>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(err);
        db.collection("subscriptions").deleteOne({
          "repo": repo,
          "channelId": channelId
        }, function(err, result) {
          if (err) reject(err);
          db.close();
          resolve(`Successfuly removed a subscription. ${repo} </> ${channelId}`);
        });
      });
    });
  }

  static token(token: string, userId: string): any {
    if (token) {
      Actions.addToken(token, userId);
    } else {
      Actions.removeToken(token, userId);
    }
  }

  static addToken(token: string, userId: string): any {
    return new Promise<any>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(err);
        db.collection("tokens").deleteMany({
          "userId": userId,
          "token": token
        }, function(err, result) {
          if (err) reject(err);
          db.collection("tokens").insertOne({
            "userId": userId,
            "token": token
          }, function(err, result) {
            if (err) reject(err);
            db.close();
            resolve(`Successfully added a token.`);
          });
        });
      });
    });
  }

  static removeToken(token: string, userId: string): any {
    return new Promise<any>(function(resolve, reject) {
      MongoClient.connect(config.db, function(err, db) {
        if (err) reject(err);
        db.collection("tokens").deleteOne({
          "userId": userId,
          "token": token
        }, function(err, result) {
          if (err) reject(err);
          db.close();
          resolve(`Successfully removed a token.`);
        });
      });
    });
  }

  static help(client: Client, channelId: string) {
    const helpMessage: string = `\`\`\`
Usage: !dbg <command> [value]

Commands:
  add <repo> ....... adds a subscription for the current channel
  remove <repo> .... removes a subscription for the current channel
  token [token] .... adds a GitHub personal access token. If no value is given, tokens linked to this user will be removed.
  help ............. displays this text\`\`\``;
    client.sendMessage(channelId, helpMessage);
  }
}
