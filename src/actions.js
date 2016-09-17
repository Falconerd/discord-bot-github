import { MongoClient } from 'mongodb';
import config from './config';

export default class Actions {
  // @TODO Check if the subscription exists and return that.
  static add(repo, channelId) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(config.db, (err, db) => {
        if (err) reject(err);
        db.collection('subscriptions').deleteMany({
          'repo': repo.toLowerCase(),
          'channelId': channelId
        }, (err, result) => {
          if (err) reject(err);
          db.collection('subscriptions').insertOne({
            repo: repo.toLowerCase(),
            channelId: channelId
          }, (err, result) => {
            if (err) reject(err);
            db.close();
            resolve(`Added a new subscription. ${repo} <---> ${channelId}`);
          });
        });
      });
    });
  }

  static remove(repo, channelId) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(config.db, (err, db) => {
        if (err) reject(err);
        db.collection('subscriptions').deleteOne({
          'repo': repo.toLowerCase(),
          'channelId': channelId
        }, (err, result) => {
          if (err) reject(err);
          db.close();
          resolve(`Removed a subscription. ${repo} <-/-> ${channelId}`);
        });
      });
    });
  }

  static help(channel) {
    const helpMessage = `\`\`\`
Usage: !dbg <command> [value]

Commands:
  add <repo> ....... adds a subscription for the current channel
  remove <repo> .... removes a subscription for the current channel
  help ............. displays this text\`\`\``;
    channel.sendMessage(helpMessage);
  }
}
