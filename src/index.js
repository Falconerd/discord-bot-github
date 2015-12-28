import axios from 'axios';
import bunyan from 'bunyan';

const log = bunyan.createLogger({ name: 'discord-bot-github' });

log.info(axios);
