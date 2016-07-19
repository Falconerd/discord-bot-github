import {Client, Message} from "discord.js";
import {CommandHandler} from "./command-handler";
import {Actions} from "./actions";
import {config} from "./config" ;

var bot = new Client({
  autoReconnect: true
});

bot.on("message", function(message: Message) {
  var command = CommandHandler.getCommand(message.content);
  if (command) {
    if (command.command === "add" && command.arguments.length) {
      Actions.add(command.arguments[0], message.channel.id)
        .then(function(result) {
          bot.sendMessage(message.channel.id, "Added subscription.");
        }).catch(function(err) {
          bot.sendMessage(message.channel.id, "Error: " + err);
        });
    } else if (command.command === "remove" && command.arguments.length) {
      Actions.remove(command.arguments[0], message.channel.id);
    } else if (command.command === "token") {
      if (command.arguments.length) {
        Actions.addToken(command.arguments[0],  message.author.id);
      } else {
        Actions.removeToken(command.arguments[0], message.author.id);
      }
    }
  }
});

bot.loginWithToken(config.token);
