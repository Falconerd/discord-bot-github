import {Client, Message, TextChannel, PMChannel} from 'discord.js';
const https = require('https');

export class CommandHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public receive(message: Message): void {
    const content = message.content.split(' ');
    const command = content[1];
    const argument = content[2];
    if (this[command]) {
        this[command](message.channel, argument);
    } else {
      this.help(message.channel);
    }
  }

  help(channel): void {
    this.client.sendMessage(
      channel,
      `\`\`\`
This bot is used to get updates about GitHub projects you are working
on.

By default, new GitHub public access tokens give READ-ONLY access to your public
data. There is no risk of this bot changing anything in your repos.

You can read more about this on the GitHub developer's page about OAuth.
https://developer.github.com/v3/oauth/#scopes

Usage: !dbg <option> <argument>

Options:
  token <token> .... add your GitHub access token (required).
  add <repo> ....... add a new subscription to this channel.
  delete <repo> .... delete a subscription in this channel.
  list ............. list subscriptions for this channel.
  help ............. display this information.

Examples:
  !dbg oauth 91293e80511083aa273d689e8a0853f636353f5f
  !dbg add hydrabolt/discord.js
  !dbg delete hydrabolt/discord.js
  !dbg list
  \`\`\``
    );
  }

  token(channel: any, content: string) {

  }

  add(channel: any, content: string): void {
    https.get(`https://github.com/${content}`, (res) => {
      if (res.statusCode === 200) {
        // Update the database!
        this.client.sendMessage(channel, `Listening for changes in ${content} in this channel.`);
      }
    }).on('error', (e) => {
      this.client.sendMessage(channel, `Error: ${e.message}`);
    });
  }

  delete(content: string): void {
    // Delete subscription
  }

  list(): void {
    // Get from database and display...
  }
}
