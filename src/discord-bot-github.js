import Discord from 'discord.js';
import out from './util/out';

class DiscordBotGithub {
  constructor(email, password, subscriptions) {
    this.email = email;
    this.password = password;
    this.servers = subscriptions;
    this.client = new Discord.Client();
    this.token = null;
  }

  start() {
    this.client.login(this.email, this.password, (error, token) => {
      if (error) return out.error(error);

      this.token = token;

      out.success('Logged in!');
    });
  }
}

export default DiscordBotGithub;

/*
export default function(email, password, subscriptions) {
  return new DiscordBotGithub(email, password, subscriptions);
}
*/
