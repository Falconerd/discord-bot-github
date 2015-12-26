'use strict';
/**
 * This is some ugly ass code :(
 * @TODO Clean it up, somehow
 */

const Discord = require('discord.js');
const axios = require('axios');
const config = require('../config');

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
function discordSuccess () {
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
function githubSuccess () {
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
function googleSuccess () {
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
function loop () {
    for (const subscription of config.subscriptions) {
        for (const repo of subscription.repositories) {
            const id = subscription.server_id;
            const name = subscription.channel_name;
            let headers = {
                'Authorization': `token ${config.github.token}`
            };
            if (etags[repo.id]) {
                headers['If-None-Match'] = etags[repo.id];
            }
            axios.get(`https://api.github.com/repos/${repo.user}/${repo.name}/events`, {
                headers
            })
                .then((response) => eventPollSuccess(id, name, repo, response))
                .catch(eventPollFailure);
        }
    }
}

/**
 * This function is called when a change is detected on a repo.
 * @param  {Object} repo         The repo which has changed.
 * @param  {Object} response     The response sent from GitHub
 */
function eventPollSuccess (id, name, repo, response) {
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
        sendMessage(id, name, repo, response.data[0]);
    }

    etags[repo.id] = response.headers.etag;
}

function checkEvents (events, type) {
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
function eventPollFailure (error) {
    // Not modified, silently fail
    if (error.status === 304) return;

    err(error);
}

function sendMessage (id, name, repo, data) {
    const channel = getChannel(id, name);
    const message = composeMessage(data);
    bot.sendMessage(channel, message, (error, message) => {
        if (error) return err(error);
        messageSuccess(message);
    });
}

function getChannel (id, name) {
    const channelName = name.replace('#', '').toLowerCase();
    for (const server of bot.servers) {
        for (const channel of server.channels) {
            if (channel.name === channelName) {
                return channel;
            }
        }
    }
    console.error('Channel not found!');
    return false;
}

/**
 * This is proably going to be the most complicated function...
 * @param  {Object} data The data required to compose the message. Plus some extra...
 * @return {String}      The message to post.
 */
function composeMessage (data) {
    switch (data.type) {
    case 'PushEvent':
        return 'Push event!';
    default:
        return false;
    }
}

function messageSuccess () {
    console.log('messageSuccess');
}

function err (error) {
    console.error(error);
}

bot.login(config.discord.email, config.discord.password);
