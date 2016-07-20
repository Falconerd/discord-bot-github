import express from "express";
import bodyParser from "body-parser";
import mongodb from "mongodb";
import {Client, Message} from "discord.js";
import {CommandChecker} from "./command-checker";
import {Actions} from "./actions";
import {Events} from "./events";
import {config} from "./config" ;

const MongoClient = mongodb.MongoClient;

const bot = new Client({
  autoReconnect: true
});

bot.on("message", function(message: Message) {
  if (message.author.id === bot.user.id) return;

  const command = CommandChecker.getCommand(message.content);

  if (command) {
    const id = (command.command === "token") ? message.author.id : message.channel.id;

    if (command.command !== "help") {
      return Actions[command.command](command.argument, id)
      .then(function(result) {
        bot.sendMessage(message.channel.id, result);
      })
      .catch(function(err) {
        bot.sendMessage(message.channel.id, err);
      });
    }
  }
  Actions.help(bot, message.channel.id);
});

bot.loginWithToken(config.token, null, null, function(error) {
  if (error) return console.log(error);
  console.log("Logged in!");
});

const events: any = {};

events.commit_comment = function(data) {}

const app = express();

app.use(bodyParser.json());
app.post("/", function(req, res) {
  const event = req.get("X-GitHub-Event");
  const message = Events[event](req.body);
  const repo = req.body.repository.full_name;
  sendMessages(repo, message);
});

function sendMessages(repo: string, message: string) {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(config.db, function(err, db) {
      if (err) reject(err);
      db.collection("subscriptions").find({
        "repo": repo
      }, function(err, result) {
        if (err) reject(err);
        db.close();
        console.dir(result);
        for (let subscription of result) {
          if (subscription.repo.toLowerCase() === repo.toLowerCase()) {
            bot.sendMessage(subscription.channelId, message);
          }
        }
      });
    });
  });
}

app.listen(process.env.PORT || 8080);
