(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('axios'), require('bunyan')) :
	typeof define === 'function' && define.amd ? define(['axios', 'bunyan'], factory) :
	factory(global.axios,global.bunyan);
}(this, function (axios,bunyan) { 'use strict';

	var foo = {};

	var log = bunyan.bunyan.createLogger({ name: 'discord-bot-github' });

	log.info(axios.axios, foo);

}));