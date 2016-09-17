import express from 'express';
import Discord from 'discord.js';
import { Message } from 'discord.js';
import request from 'request';
import { MongoClient } from 'mongodb';
import CONFIG from './config';

const app = express();
const bot = new Discord.Client();

// webhook POST -> construct message -> send message
app.post('/', (req, res) => {
  // @TODO Verify that this request came from GitHub
  const event = req.get("X-GitHub-Event");
  if (event) {
    const message = Events[event](req.body);
    const repo = req.body.repository.full_name.toLowerCase();
    sendMessages(repo, message);
    res.sendStatus(200);
  } else {
    res.sendStaus(400);
  }
});

app.get('/', (req, res) => {
  res.send('This address is not meant to be accessed by a web browser. Please read the readme on GitHub');
});

function sendMessages(repo, message) {
  MongoClient.connect(CONFIG.db, (err, db) => {
    if (err) reject(err);
    db.collection('subscriptions').find({
      'repo': repo
    })
    .toArray((err, subscriptions) => {
      db.close();
      subscriptions.forEach(subscription => {
        const channel = bot.channels.find('id', subscription.channelId);
        if (channel) {
          channel.sendMessage(message);
        } else {
          console.log('Error: Bot not allowed in channel');
        }
      });
    });
  });
}

// discord message event -> parseMessage -> Command -> Action
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

app.listen(process.env.PORT || 8080, () => {
  bot.login(CONFIG.token)
  .then(console.log('Logged in.'))
  .catch(error => console.log(error));
});
