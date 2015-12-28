import DiscordBotGithub from './discord-bot-github';
import config from './config';

const bot = new DiscordBotGithub(config.discord.email, config.discord.password);

bot.start();

export const summat = 'summat';
