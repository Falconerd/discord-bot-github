import {Client} from 'discord.js';
import {CommandHandler} from './command-handler';
const config = require('../config');

const client = new Client({
  token: config.token,
  autorun: true,
});

const commandHandler = new CommandHandler(client);

client.on('ready', function() {
  console.log(`Logged in as ${client.user.username} - (${client.user.id})`);
});

client.on('message', function(message) {
  if (message.content.substring(0, 4) === '!dbg') {
    commandHandler.receive(message);
  }
});

client.loginWithToken(config.token);
