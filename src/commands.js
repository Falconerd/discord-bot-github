import request from 'request';
import Actions from './actions';

export default class Commands {
  /**
   * Check if the repo exists via statusCode.
   * Check if the repo is public or private.
   */
  static add(channel, mongo_client, repo, isPrivate) {

    if (isPrivate === '--private') {
      // If the repo is private it will always return 404
      // So lets add it in good faith anyway.
      return Actions.add(repo, channel.id, mongo_client)
      .then(result => channel.sendMessage(result))
      .catch(error => {
        console.error('ERROR:', error);
        channel.sendMessage('Something went wrong. An error has been logged.')
      });
    } else {
      request(`https://github.com/${repo}`, (err, res) => {
        if (res.statusCode === 200) {
          return Actions.add(repo, channel.id, mongo_client)
          .then(() => channel.sendMessage(`Subscription added. I will now post updates about ${repo} in #${channel.name}.`))
          .catch(error => {
            console.error('ERROR:', error);
            channel.sendMessage('Something went wrong. An error has been logged.')
          });
        }
        if (res.statusCode === 404) {
          channel.sendMessage('Repository not found.');
        }
      });
    }
  }

  static remove(channel, mongo_client, repo, isPrivate) {
    return Actions.remove(repo, channel.id, mongo_client)
    .then(() => channel.sendMessage(`Subscription removed. I will no longer post updates about ${repo} in #${channel.name}.`))
    .catch(error => {
      console.error('ERROR:', error);
      channel.sendMessage('Something went wrong. An error has been logged.')
    });
  }

  static help(channel) {
    return Actions.help(channel);
  }
}

