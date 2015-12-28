import chalk from 'chalk';

const fatal = chalk.bold.red.inverse;
const error = chalk.bold.red;
const warn = chalk.yellow;
const info = chalk.white;
const debug = chalk.blue;
const trace = chalk.magenta;

export default {
  write: function(message) {
    process.stdout.write(message + '\n');
  },
  fatal: function(message) {
    this.write(fatal(`[FATAL] ${message}`));
  },
  error: function(message) {
    this.write(error(`[ERROR] ${message}`));
  },
  warn: function(message) {
    this.write(warn(`[WARN] ${message}`));
  },
  info: function(message) {
    this.write(info(`[INFO] ${message}`));
  },
  debug: function(message) {
    this.write(debug(`[DEBUG] ${message}`));
  },
  trace: function(message) {
    this.write(trace(`[TRACE] ${message}`));
  }
}
