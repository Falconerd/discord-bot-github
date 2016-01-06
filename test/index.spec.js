import Bot from '../src/bot';

// Tests will fail if you do not have a valid config.json in the root directory.
const config = require('../config.json');

describe('Bot', () => {
  describe('#start()', () => {
    it('should log in if given correct credentials', function(done) {
      this.timeout(4000);
      const bot = new Bot(config);
      bot.start();
      bot.on('ready', function() {
        done()
      });
    });
  });
});
