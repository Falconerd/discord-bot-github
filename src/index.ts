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
      Actions.help(message);
    } else {
      Actions[command.command](command.argument, id)
      .then(function(result) {
        message.reply(result);
      })
      .catch(function(err) {
        console.error(err);
      });
    }
  }
});

const events: any = {};

events.commit_comment = function(data) {}

const app = express();

app.use(bodyParser.json());
app.post("/", function(req, res) {
  const event = req.get("X-GitHub-Event");
  if (event === "ping") return res.sendStatus(200); // Bandaid
  if (!Events[event]) {
    console.log("Event doesn't exist!", event);
    return res.sendStatus(200); // Event doesn't exist? Log it!
  }
  const message = Events[event](req.body);
  const repo = req.body.repository.full_name.toLowerCase();
  sendMessages(repo, message);
  res.send(200);
});
app.get("/", function(req, res) {
  res.send("This address is not meant to be accessed by a web browser. Please read the readme on GitHub.");
});

function sendMessages(repo: string, message: string) {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(config.db, function(err, db) {
      if (err) reject(err);
      db.collection("subscriptions").find({
        "repo": repo
      })
      .toArray(function(err, subscriptions) {
          for (let subscription of subscriptions) {
            if (subscription.repo === repo.toLowerCase()) {
              console.log("Sending:", repo, message);
	      // So what happens if we don't find a channel? Hmm...
	      const channel = bot.channels.find('id', subscription.channelId);
	      if (channel) channel.sendMessage(message);
              // bot.sendMessage(subscription.channelId, message);
            }
          }
          db.close();
      });
    });
  });
}

app.listen(process.env.PORT || 8080, function() {
  bot.login(config.token)
  .then(result => console.log("Logged in", result))
  .catch(error => console.log(error));
});
