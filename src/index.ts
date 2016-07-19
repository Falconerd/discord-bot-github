import {Client, Message} from "discord.js";
import {CommandChecker} from "./command-handler";
import {Actions} from "./actions";
import {config} from "./config" ;

var bot = new Client({
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

bot.loginWithToken(config.token);
