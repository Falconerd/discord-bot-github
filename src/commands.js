import request from 'request';
import Actions from './actions';

export default class Commands {
  /**
   * Check if the repo exists via statusCode.
   * Check if the repo is public or private.
   */
  static add(channel, repo, _private) {
    request(`https://github.com/${repo}`, (err, res) => {
      if (res.statusCode === 200) {
        return Actions.add(repo, channel.id)
        .then(result => channel.sendMessage(result))
        .catch(error => {
          console.error('ERROR:', error);
          channel.sendMessage('Something went wrong. An error has been logged.')
        });
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

  static remove(channel, repo, _private) {
    return Actions.remove(repo, channel.id)
    .then(result => channel.sendMessage(result))
    .catch(error => {
      console.error('ERROR:', error);
      channel.sendMessage('Something went wrong. An error has been logged.')
    });
  }

  static help(channel) {
    return Actions.help(channel);
  }
}
