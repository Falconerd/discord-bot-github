import Discord from 'discord.js';
import axios from 'axios';
import out from './util/out';
import templates from './templates';

class DiscordBotGithub {
  constructor(config) {
    this.config = config;
    this.email = config.email;
    this.password = config.password;
    this.subscriptions = config.subscriptions;
    this.client = new Discord.Client();
    this.token = null;
    this.interval = config.interval;
    this.etags = {};
  }

  start() {
    this.client.login(this.email, this.password, (error, token) => {
      if (error) return out.error('[Login]' + error);

      this.token = token;

      out.info('Discord GitHub Bot listening for changes...');

      setInterval(this.loop.bind(this), this.interval);
    });
  }

  loop() {
    // Check to see if we have any changes in the repositories.
    for (let subscription of this.subscriptions) {
      const repo = subscription.repository;
      // If there has been a change, loop through the servers.
      // Else, we want to continue to the next subscription.
      let headers = {
        'Authorization': `token ${this.config.token}`
      };
      if (this.etags[repo]) {
        headers['If-None-Match'] = this.etags[repo];
      }
      axios.get(`https://api.github.com/repos/${repo}/events`, { headers })
      .then((response) => this.eventPollSuccess(response, subscription))
      .catch(this.eventPollFailure);
    }
  }

  eventPollSuccess(response, subscription) {
    if (response.status !== 200) {
      out.error(`Wrong response code. Expected 200 and got ${response.status}`);
      return;
    }

    if (!response.headers) {
      out.error('No headers found');
      return;
    }

    if (!response.headers.etag) {
      out.error('No etag header found');
      return;
    }

    if (!response.data.length) {
      out.error('No data found');
      return;
    }

    if (this.etags[subscription.repository]) {
      const data = response.data[0];
      out.info('Something has changed!');
      // Loop through the servers and send messages to the correct channels
      // given that the event is being traked by said channel.
      // @note: triple for-loop?
      for (let server of subscription.servers) {
        for (let channel of server.channels) {
          for (let eventType of channel.events) {
            if (eventType === data.type.replace('Event', '')) {
              // Event type is being tracked by this channel...
              this.sendMessage(server.id, channel.name, data);
            }
          }
        }
      }
    }

    this.etags[subscription.repository] = response.headers.etag;
  }

  eventPollFailure(error) {
    if (error.status === 304) {
      return;
    }

    out.error(JSON.stringify(error, null, 2));
  }

  sendMessage(id, name, data) {
    // Construct the message from a template.
    const content = this.constructMessage(data);
    // Get the channel ID
    const channelResolvable = this.getChannelResolvable(id, name);
    // Send the message
    this.client.sendMessage(channelResolvable, content);
  }

  constructMessage(data) {
    switch (data.type) {
      case 'PushEvent':
        if (data.payload.size === 1) {
          return templates.push(data);
        }
        return templates.pushMulti(data);
      case 'CreateEvent':
        if (data.payload.ref_type === 'branch') {
          return templates.createBranch(data);
        } else if (data.payload.ref_type === 'tag') {
          return templates.createTag(data);
        }
        break;
      case 'DeleteEvent':
        if (data.payload.ref_type === 'branch') {
          return templates.deleteBranch(data);
        } else if (data.payload.ref_type === 'tag') {
          return templates.deleteTag(data);
        }
        break;
      case 'PullRequestEvent':
        if (data.payload.action === 'opened') {
          return templates.pullRequestOpened(data);
        }
        break;
      default:
        return 'Message!';
    }
  }

  getChannelResolvable(id, name) {
    for (let server of this.client.servers) {
      if (server.id === id) {
        for (let channel of server.channels) {
          if (channel.type === 'text' && channel.name === name) {
            return channel.id;
          }
        }
      }
    }
  }

  logServers() {
    out.info(this.client.servers);
  }

  on(e, f) {
    this.client.on(e, f);
  }
}

export default DiscordBotGithub;
