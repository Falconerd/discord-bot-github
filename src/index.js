import fs from 'fs';
import out from './util/out';
import Bot from './bot';

if (process && process.argv.length >= 3) {
  fs.readFile(process.argv[2], function(err, config) {
    if (err) return out.error(err);
    const bot = new Bot(JSON.parse(config));
    bot.start();
  });
}
