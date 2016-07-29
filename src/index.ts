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

    if (command.command === "help") {
      Actions.help(bot, message.channel.id);
    } else {
      Actions[command.command](command.argument, id)
      .then(function(result) {
        bot.sendMessage(message.channel.id, result);
      })
      .catch(function(err) {
        bot.sendMessage(message.channel.id, err);
      });
    }
  }
});

const events: any = {};

events.commit_comment = function(data) {}

const app = express();

app.use(bodyParser.json());
app.post("/", function(req, res) {
  console.log(req);
  const event = req.get("X-GitHub-Event");
  const message = Events[event](req.body);
  const repo = req.body.repository.full_name.toLowerCase();
  console.log("repo: ", repo);
  sendMessages(repo, message);
  res.send(200);
});

function sendMessages(repo: string, message: string) {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(config.db, function(err, db) {
      if (err) reject(err);
      db.collection("subscriptions").find({
        "repo": repo
      })
      .toArray(function(err, subscriptions) {
          console.log(subscriptions);
          for (let subscription of subscriptions) {
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

app.listen(process.env.PORT || 8080, function() {
  bot.loginWithToken(config.token, null, null, function(error) {
    if (error) return console.log(error);
    console.log("Logged in!");
  });
});
