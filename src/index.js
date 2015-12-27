'use strict';
/**
 * @NOTE
 * There is a bit of stuff in here which I think could really benefit from a
 * better understanding of Promises. Someone help me :(
 *
 * There is also some really gross stuff where varialbles are being passed to
 * like 5 functions before being used...
 */

const Discord = require('discord.js');
const axios = require('axios');
const config = require('../config');
const messageTemplates = require('./messageTemplates');

/**
 * This object will hold the id and etags of each repository.
 * @example
 * {
 *     37756683: "a18c3bded88eb5dbb5c849a489412bf3"
 * }
 * @type {Object}
 */
const etags = {};

const bot = new Discord.Client();

bot.on('ready', discordSuccess);

/**
 * Discord has successfully been authorised.
 * Check GitHub authorisation.
 */
function discordSuccess() {
  console.log('Discord: Authorised.');
  axios.get('https://api.github.com/user', {
    headers: { 'Authorization': `token ${config.github.token}` }
  })
  .then(githubSuccess)
  .catch(err);
}

/**
 * GitHub has successfully been authorised.
 * Check Google authorisation.
 */
function githubSuccess() {
  console.log('GitHub: Authorised.');
  axios.post(`https://www.googleapis.com/urlshortener/v1/url?key=${config.google.key}`, {
    headers: { 'Content-Type': 'application/json' },
    longUrl: 'http://www.google.com/'
  })
  .then(googleSuccess)
  .catch(err);
}

/**
 * Google has successfully been authorised.
 * Start the polling of GitHub's API.
 */
function googleSuccess() {
  console.log('Google Url Shortener: Authorised.');
  setInterval(loop, config.interval);
}

/**
 * This function runs every {config.interval} milliseconds. Default 5000.
 * It loops through the configured subscriptions and then checks to see if any
 * changes have been made.
 *
 * If changes were made to the repo, {eventPollSuccess} will fire.
 * If no changes were made, {eventPollFailure} will fire and then silently fail.
 *
 * @NOTE Perhaps do a process.exit() if a code besides 200 or 304 is returned...
 */
function loop() {
  for (const subscription of config.subscriptions) {
    for (const repo of subscription.repositories) {
      const id = subscription.server_id;
      const name = subscription.channel_name;
      const invite = subscription.invite;
      let headers = {
        'Authorization': `token ${config.github.token}`
      };
      if (etags[repo.id]) {
        headers['If-None-Match'] = etags[repo.id];
      }
      axios.get(`https://api.github.com/repos/${repo.user}/${repo.name}/events`, {
        headers
      })
      .then((response) => eventPollSuccess(id, name, repo, invite, response))
      .catch(eventPollFailure);
    }
  }
}

/**
 * This function is called when a change is detected on a repo.
 * @param  {Object} repo         The repo which has changed.
 * @param  {Object} response     The response sent from GitHub
 */
function eventPollSuccess(id, name, repo, invite, response) {
  if (!response.status === 200) {
    return console.error('Wrong response code', response.status);
  }

  if (!response.headers) {
    return console.error('No headers found');
  }

  if (!response.headers.etag) {
    return console.error('No etag header found');
  }

  if (!response.data.length) {
    return console.error('No data found');
  }

  if (!response.data[0].type) {
    return console.error('No event type found');
  }

  const type = response.data[0].type.replace('Event', '');

  if (!checkEvents(repo.events, type)) {
    return console.log(`'${type}' is not subscribed to. Skipping.`);
  }

  // Only post a message about changes if this was defined.
  if (etags[repo.id]) {
    constructMessageObject(id, name, invite, response.data[0]);
  }

  etags[repo.id] = response.headers.etag;
}

function checkEvents(events, type) {
  for (const eventType of events) {
    if (eventType === type) return true;
  }
  return false;
}

/**
 * This function is called when the event polling either fails or if GitHub
 * returns a status of 304 (unchanged).
 * @param  {Object} error The error object.
 */
function eventPollFailure(error) {
  // Not modified, silently fail
  if (error.status === 304) return;

  err(error);
}

/**
 * [constructMessageObject description]
 * @param  {Number|String} id Server id
 * @param  {[type]} name      Channel name
 * @param  {[type]} data      Response data
 */
function constructMessageObject(id, name, invite, data) {
  let messageObject;
  switch (data.type) {
    case 'PushEvent':
      if (data.payload.size === 1) {
        messageObject = messageTemplates.pushEventSingle(data);
      } else {
        messageObject = messageTemplates.pushEventMultiple(data);
      }
      break;
    case 'CreateEvent':
      if (data.payload.ref_type === 'branch') {
        messageObject = messageTemplates.createEventBranch(data);
      } else if (data.payload.ref_type === 'tag') {
        messageObject = messageTemplates.createEventTag(data);
      }
      break;
    case 'PullRequestEvent':
      if (data.payload.action === 'opened') {
        messageObject = messageTemplates.pullRequestEventOpened(data);
      }
      break;
    default:
      return false;
  }
  if (messageObject.urls) {
    shortenUrls(messageObject.text, messageObject.urls, id, name, invite);
  } else {
    finaliseMessage(messageObject.text, [], id, name, invite);
  }
}

function shortenUrls(text, urls, id, name, invite) {
  const shortUrls = [];
  for (let i = 0; i < urls.length; i++) {
    shortenUrl(urls[i], (response) => {
      shortUrls.push(response.data.id);
      if (i === urls.length - 1) {
        finaliseMessage(text, shortUrls, id, name, invite);
      }
    });
  }
}

function finaliseMessage(text, urls, id, name, invite) {
  let message = text.slice(0);
  for (var i = 0; i < urls.length; i++) {
    message = message.replace('#{' + i + '}', urls[i]);
  }
  if (!checkServer(id)) {
    bot.joinServer(invite)
      .then(sendMessage(message, name))
      .catch(err);
  } else {
    sendMessage(message, name);
  }
}

function sendMessage(message, name) {
  const channel = getChannel(name);
  if (channel) {
    bot.sendMessage(channel, message)
      .then(messageSuccess)
      .catch(err);
  }
}

function checkServer(serverId) {
  for (const server of bot.servers) {
    if (server.id === serverId) {
      return true;
    }
  }

  return false;
}

function getChannel(name) {
  for (const channel of bot.channels) {
    if (channel.name === name) {
      return channel;
    }
  }
  return false;
}

function shortenUrl(url, callback) {
  axios.post(`https://www.googleapis.com/urlshortener/v1/url?key=${config.google.key}`, {
    headers: { 'Content-Type': 'application/json' },
    longUrl: url
  })
  .then(callback)
  .catch(err);
}

function messageSuccess() {
  console.log('messageSuccess');
}

function err(error) {
  console.error(error);
}

bot.login(config.discord.email, config.discord.password);
