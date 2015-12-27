'use strict';
/*
 * There is a bit of stuff in here which I think could really benefit from a
 * better understanding of Promises. Someone help me :(
 *
 * There is also some really gross stuff where varialbles are being passed to
 * like 5 functions before being used...
 *
 * @TODO Abstract a lot of things out into separate modules. I hate long files.
 * @TODO Learn more about promises.
 */

const Discord = require('discord.js');
const axios = require('axios');
const config = require('../config');
const events = require('./events');

/**
 * This object will hold the id and etags of each repository.
 *
 * Is there something to be said about using keys to store data? It seems wrong
 * and also convenient.
 *
 * @example
 * {
 *     37756683: "a18c3bded88eb5dbb5c849a489412bf3"
 * }
 * @type {Object}
 */
const etags = {};

/**
 * Object which maps event types to their functions.
 * @type {Object}
 */
const templates = {
  PushEvent: events.push,
  CreateEvent: events.create,
  PullRequestEvent: events.pullRequest
};

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
 * This function runs every {@link config.interval} milliseconds. Default 5000.
 * It loops through the configured subscriptions and then checks to see if any
 * changes have been made.
 *
 * If changes were made to the repo, {@link eventPollSuccess} will fire.
 * If no changes were made, {@link eventPollFailure} will fire and then silently
 * return.
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
 * Called when a change is detected.
 * @param  {String} id       Discord server id string.
 * @param  {String} name     Discord channel to be used.
 * @param  {Object} repo     Object pulled from config pertaining to the repo.
 * @param  {String} invite   Url pulled from config to allow bot on to server.
 * @param  {Object} response The response from GitHub's API server.
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

/**
 * Checks if the event type is listed in config.
 * @param  {Object} events List of events to check for.
 * @param  {String} type   Event type to check list for.
 * @return {Boolean}       True if event type found in config. False otherwise.
 */
function checkEvents(events, type) {
  for (const eventType of events) {
    if (eventType === type) return true;
  }
  return false;
}

/**
 * Called when event polling fails. Also called when a 304 status is returned.
 * 304 status means no changes were detected, so we return nothing and do not
 * log an error.
 * @param  {Object} error The error object.
 */
function eventPollFailure(error) {
  if (error.status === 304) return;

  err(error);
}

/**
 * Constructs a message as an object and then passes it to either
 * {@link shortenUrls} if there URLs to be shortened or {@link finaliseMessage} if
 * there are none.
 * @param  {String} id     Discord server id.
 * @param  {String} name   Discord channel to be used.
 * @param  {String} invite Url pulled from config to allow bot onto server.
 * @param  {Object} data   The data used to construct the message.
 */
function constructMessageObject(id, name, invite, data) {
  const messageObject = templates[data.type](data);
  if (messageObject.urls) {
    shortenUrls(messageObject.text, messageObject.urls, id, name, invite, data.type);
  } else {
    finaliseMessage(messageObject.text, [], id, name, invite, data.type);
  }
}

/**
 * Shortens URLS using the Google URL shortener API. Instead of returning a list
 * of shortened URLs when finished, this function calls {@link finaliseMessage}
 * because I'm bad at promises.
 * @param  {String} text   The message text, passed through... :(
 * @param  {Array}  urls   The URLs to be shortened.
 * @param  {String} id     Discord server id.
 * @param  {String} name   Discord channel to be used.
 * @param  {String} invite Url pulled from config to allow bot onto server.
 * @param  {String} type   Event type.
 */
function shortenUrls(text, urls, id, name, invite, type) {
  const shortUrls = [];
  for (let i = 0; i < urls.length; i++) {
    shortenUrl(urls[i], (response) => {
      shortUrls.push(response.data.id);
      if (i === urls.length - 1) {
        finaliseMessage(text, shortUrls, id, name, invite, type);
      }
    });
  }
}

/**
 * Shortens a URL and then performs the callback function supplied.
 * @param  {String}   url      The URL to be shortened.
 * @param  {Function} callback The function to call upon completion.
 */
function shortenUrl(url, callback) {
  axios.post(`https://www.googleapis.com/urlshortener/v1/url?key=${config.google.key}`, {
    headers: { 'Content-Type': 'application/json' },
    longUrl: url
  })
  .then(callback)
  .catch(err);
}

/**
 * Replaces the placeholders for URLs with the shortened URLs and then passes
 * the message to {@link sendMessage}. If bot is not connected to the specified
 * server, it will attempt to connect and then send the messsage upon successful
 * connection. If the bot cannot connect, an error will be sent and the message
 * will be lost.
 *
 * @TODO Message retention in case of failures... Shouldn't acutally be hard...
 *
 * @param  {String} text   The message text, passed through... :(
 * @param  {Array}  urls   The URLs to be shortened.
 * @param  {String} id     Discord server id.
 * @param  {String} name   Discord channel to be used.
 * @param  {String} invite Url pulled from config to allow bot onto server.
 * @param  {String} type   Event type.
 */
function finaliseMessage(text, urls, id, name, invite, type) {
  let message = text.slice(0);
  for (var i = 0; i < urls.length; i++) {
    message = message.replace('#{' + i + '}', urls[i]);
  }
  if (!checkServer(id)) {
    bot.joinServer(invite)
      .then(sendMessage(id, name, type, message))
      .catch(err);
  } else {
    sendMessage(id, name, type, message);
  }
}

/**
 * Finds the specified channel and attempts to send the message.
 * @param  {String} id     Discord server id.
 * @param  {String} name    The channel to send it on.
 * @param  {String} type   Event type.
 * @param  {String} message The message to send.
 */
function sendMessage(id, name, type, message) {
  const channel = getChannel(name);
  if (channel) {
    bot.sendMessage(channel, message)
      .then(messageSuccess(id, name, name, type, message))
      .catch(err);
  }
}

/**
 * Checks to see if the bot is connected to a server.
 * @param  {String} serverId The server id.
 * @return {Boolean}         True if connected. False otherwise.
 */
function checkServer(serverId) {
  for (const server of bot.servers) {
    if (server.id === serverId) {
      return true;
    }
  }

  return false;
}

/**
 * Finds the first channel with the name supplied.
 * @param  {String} name The channel name.
 * @return {Discord.Channel}     The channel object.
 */
function getChannel(name) {
  for (const channel of bot.channels) {
    if (channel.name === name) {
      return channel;
    }
  }
  return null;
}

/**
 * Logs a success message to the NodeJs console.
 * @param  {String} id     Discord server id.
 * @param  {String} name    The channel to send it on.
 * @param  {String} type   Event type.
 * @param  {String} message The message to send.
 */
function messageSuccess(id, channel, name, type, message) {
  const date = new Date(Date.now()).toLocaleString();
  const server = getServerName(id);
  console.log(`[${date}][${type}] → [${server}/${channel}]`);
}

/**
 * Get a Discord server name.
 * @param  {id} id Server id.
 * @return {String}    The name of the server.
 */
function getServerName(id) {
  for (const server of bot.servers) {
    if (server.id === id) {
      return server.name;
    }
  }
  return '-Unknown Server-';
}

function err(error) {
  console.error(error);
}

bot.login(config.discord.email, config.discord.password);