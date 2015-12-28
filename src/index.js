import { axios } from 'axios';
import { bunyan } from 'bunyan';
import { foo } from './module';

const log = bunyan.createLogger({ name: 'discord-bot-github' });

log.info(axios, foo);
