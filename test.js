const Discord = require('discord.js');
const config = require('./config');

const bot = new Discord.Client();

bot.on('ready', () => {
  console.log(bot.servers);
});

bot.login(config.discord.email, config.discord.password);
