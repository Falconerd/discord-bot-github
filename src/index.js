'use strict';
/**
 * This is some ugly ass code :(
 * @TODO Clean it up, somehow
 */

const Discord = require('discord.js');
const axios = require('axios');
const config = require('../config');
const messages = require('./messages');

const bot = new Discord.Client();

let githubReady = false;

function checkServer (serverId) {
    for (const server of bot.servers) {
        if (server.id === serverId) {
            return true;
        }
    }

    return false;
}

function checkEvents (events, type) {
    for (const event in events) {
        if (event === type.slice(0, -5)) {
            return true;
        }
    }
    return false;
}

function getChannel (name) {
    for (const channel in bot.channels) {
        if (channel.name === name) {
            return channel;
        }
    }
    return false;
}

function composeMessage (data) {
    const events = {
        PushEvent: (data) => {
            let message;
            return message;
        }
    }

    return events[data.type];
}

function checkSubscriptions (subscriptions) {
    for (const subscription of subscriptions) {
        for (const repo of subscription.repositories) {
            axios.get(`https://api.github.com/repos/${repo.user}/${repo.name}/events`, {
                headers: {
                    'Authorization': `token ${config.github.token}`
                }
            })
                .then((response) => {
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

                    if (!repo.etag) {
                        repo.etag = response.headers.etag;
                    }

                    if (repo.etag === response.headers.etag) {
                        return false;
                    }

                    if (!checkEvents(repo.events, response.data[0].type)) {
                        return console.log('Event type not tracked');
                    }

                    // Only send a message if we're connected to a server
                    if (!checkServer(subscription.server_id)) {
                        console.log('Connecting to server ${server.id}:${server.name}...');
                        bot.joinServer(subscription.invite, (error, server) => {
                            if (error) {
                                return console.error(error);
                            }
                        });
                        return false;
                    }

                    const channel = getChannel(subscription.channel_name);

                    if (!channel) {
                        return console.error('Could not find specified channel');
                    }

                    const message = composeMessage(response.data[0]);

                    if (!message) {
                        return console.error(`Message could not be composed.
                        Please create a GitHub issue @
                        https://github.com/Falconerd/discord-bot-github/issues/new`);
                    }

                    bot.sendMessage(channel, message, { tts: false }, (error, message) => {
                        if (error) {
                            return console.error(error);
                        }

                        // We've successfully sent a message, update the etag
                        repo.etag = response.headers.etag;
                    });
                })
                .catch((error) => {
                    console.error(error)
                });
        }
    }
}

bot.on('ready', () => {
    setInterval(() => {
        if (githubReady) {
            checkSubscriptions(config.subscriptions)
        }
    }, 5000);
});

bot.login(config.discord.email, config.discord.password);

axios.get('https://api.github.com/user', {
    headers: {
        'Authorization': `token ${config.github.token}`
    }
})
    .then((response) => {
        if (response.status === 200) githubReady = true;
    })
    .catch((error) => {
        console.error(error);
        console.error('^^^^ ERROR ^^^^');
    });
