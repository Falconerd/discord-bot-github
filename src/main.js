import Discord from 'discord.js';
import { Message } from 'discord.js';
import request from 'request';
import { MongoClient } from 'mongodb';
import CONFIG from './config';

const bot = new Discord.Client();
const token = CONFIG.token;

// event -> parseMessage -> Command -> Action

app.post('/', (req, res) => {
  console.log(req);
});

/**
 * Check to see if any message read by this bot is relevant.
 * - Do nothing if the message is from the bot itself.
 * - Check if the message is prefaced with '!dbg'.
 * - If the command is prefaced, check if the command exists.
 * - If the command exists, check if it has correct arguments.
 * - Then perform the action sepcified.
 */
bot.on('message', (message) => {
  if (message.author.id === bot.user.id) return;
  if (message.content.substring(0, 4) !== '!dbg') return;

  const commandObject = parseMessage(message);
  // message.reply(JSON.stringify(commandObject, null, 2));
  Commands[commandObject.command](message.channel, ...commandObject.args);
});

/**
 * Take in the content of a message and return a command
* @example
 * @param  {Message} message The Discord.Message object
 * @return {}         [description]
 */
function parseMessage(message) {
  const parts = message.content.split(' ');
  const command = parts[1];
  const args = parts.slice(2);

  if (typeof Commands[command] === 'function') {
    // @TODO We could check the command validity here
    return { command, args };
  } else {
    console.error(`Command '${command}' does not exist.`);
    return null;
  }
}

class Commands {
  /**
   * Check if the repo exists via statusCode.
   * Check if the repo is public or private.
   * @param {[type]} repo [description]
   * @param {[type]} channel [description]
   */
  static add(channel, repo, _private) {
    request(`https://github.com/${repo}`, (err, res) => {
      if (res.statusCode === 200) {
        return Actions.add(repo, channel.id)
        .then(result => channel.sendMessage(result))
        .catch(error => channel.sendMessage(error));
      }
      if (res.statusCode === 404) {
        if (_private === '--private') {
          // Check if the user has a token stored.
        } else {
          channel.sendMessage('Repository not found.');
        }
      }
    });
  }
}

class Actions {
  // @TODO Check if the subscription exists and return that.
  static add(repo, channelId) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(CONFIG.db, (err, db) => {
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
            resolve(`Added a new subscription. ${repo} <-> ${channelId}`);
          });
        });
      });
    });
  }
}

bot.login(CONFIG.token);
