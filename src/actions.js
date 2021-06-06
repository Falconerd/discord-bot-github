import { MongoClient } from "mongodb";
import config from "./config";

export default class Actions {
  // @TODO Check if the subscription exists and return that.
  static add(repo, channelId, mongo_client) {
    return new Promise(async (resolve, reject) => {
      const db = mongo_client.db("discobot");
      const collection = db.collection("subscriptions");

      const query = { repo: repo.toLowerCase(), channelId };
      let result = await collection.deleteMany(query);
      console.log("Deleted", result.deletedCount, "documents");

      const doc = { repo: repo.toLowerCase(), channelId };
      result = await collection.insertOne(doc);
      console.log(
        result.insertedCount,
        "documents were inserted with the _id: result.insertedId"
      );

      resolve();
    });
  }

  static remove(repo, channelId, mongo_client) {
    return new Promise(async (resolve, reject) => {
      const db = mongo_client.db("discobot");
      const collection = db.collection("subscriptions");

      const query = { repo: repo.toLowerCase(), channelId };
      await collection.deleteOne(query);

      resolve();
    });
  }

  static help(channel) {
    const helpMessage = `\`\`\`
Usage: !dbg <command> [value]

Commands:
  add <org>/<repo> ....... adds a subscription for the current channel.
  remove <org>/<repo> .... removes a subscription for the current channel.
  help ................... displays this help message.\`\`\``;
    channel.sendMessage(helpMessage);
  }
}
