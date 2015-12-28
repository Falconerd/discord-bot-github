import { axios } from 'axios';
import { bunyan } from 'bunyan';

var foo = {};

var log = bunyan.createLogger({ name: 'discord-bot-github' });

log.info(axios, foo);