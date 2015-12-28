import config from './rollup.config';

config.format = 'umd';
config.dest = 'dist/discord-bot-github.umd.js';
config.moduleName = 'discordBotGithub';

export default config;
