import Discord from 'discord.js';
import axios from 'axios';
import out from './util/out';
import contains from './util/contains';
import templates from './templates';

class DiscordBotGithub {
  constructor(config) {
    this.config = config;
    this.email = config.email;
    this.password = config.password;
    this.subscriptions = config.subscriptions;
    this.client = new Discord.Client();
    this.client.on('ready', this.ready.bind(this));
    this.token = null;
    this.interval = config.interval;
    this.etags = {};
    this.queue = [];
  }

  start() {
    this.client.login(this.email, this.password, (error) => {
      if (error) return out.error('[Login]' + error);
    });
  }

  ready() {
    out.info('Discord GitHub Bot listening for changes...');
    this.connectToServers();
    setInterval(this.loop.bind(this), this.interval);
  }

  connectToServers() {
    const connectedServers = [];

    for (let server of this.client.servers) {
      connectedServers.push(server.id);
    }

    for (let subscription of this.subscriptions) {
      for (let server of subscription.servers) {
        if (!contains(connectedServers, server.id)) {
          if (server.invite) {
            this.client.joinServer(server.invite, (error) => {
              if (error)
                out.error(`Could not connect to server with id: ${server.id}`);
            });
          }
        }
      }
    }
  }

  loop() {
    // Check to see if we have any messages in the queue.
    if (this.queue.length) {
      this.sendQueuedMessages();
    }
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
              // Queue this message for sending
              this.queue.push({
                id: server.id,
                name: channel.name,
                content: this.constructMessage(data)
              });
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

    if (error.status === 401) {
      out.error('Problem with GitHub authentication. Check your API token.');
      return;
    }
    out.error(error);
  }

  sendQueuedMessages() {
    while (this.queue.length) {
      let message = this.queue.shift();
      this.sendMessage(message.id, message.name, message.content);
    }
  }

  sendMessage(id, name, content) {
    // Get the channel ID
    const channelResolvable = this.getChannelResolvable(id, name);
    // Send the message
    this.client.sendMessage(channelResolvable, content, {}, (error) => {
      if (error) {
        out.error('Error sending message');
        out.error(error);
      }
    });
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
        } else if (data.payload.action === 'reopened') {
          return templates.pullRequestRepoened(data);
        } else if (data.payload.action === 'closed') {
          return templates.pullRequestClosed(data);
        }
        break;
      case 'IssueCommentEvent':
        if (data.payload.action === 'created') {
          return templates.issueCommentCreated(data);
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
