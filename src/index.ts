import express from "express";
import bodyParser from "body-parser";
import mongodb from "mongodb";
import {Client, Message} from "discord.js";
import {CommandChecker} from "./command-checker";
import {Actions} from "./actions";
import {config} from "./config" ;

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

const app = express();

app.use(bodyParser.json());
app.post("/", function(req, res) {
  console.log(req.body);
});

app.listen(process.env.PORT || 8080);
