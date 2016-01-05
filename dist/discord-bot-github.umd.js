(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fs'), require('path'), require('discord.js'), require('axios'), require('chalk')) :
  typeof define === 'function' && define.amd ? define(['fs', 'path', 'discord.js', 'axios', 'chalk'], factory) :
  global.discordBotGithub = factory(global.fs,global.path,global.Discord,global.axios,global.chalk);
}(this, function (fs,path,Discord,axios,chalk) { 'use strict';

  fs = 'default' in fs ? fs['default'] : fs;
  path = 'default' in path ? path['default'] : path;
  Discord = 'default' in Discord ? Discord['default'] : Discord;
  axios = 'default' in axios ? axios['default'] : axios;
  chalk = 'default' in chalk ? chalk['default'] : chalk;

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  babelHelpers;
  var _fatal = chalk.bold.red.inverse;
  var _error = chalk.bold.red;
  var _warn = chalk.yellow;
  var _info = chalk.white;
  var _debug = chalk.blue;
  var _trace = chalk.magenta;

  var out = {
    write: function write(message) {
      process.stdout.write(message + '\n');
    },
    fatal: function fatal(message) {
      this.write(_fatal('[FATAL] ' + message));
    },
    error: function error(message) {
      this.write(_error('[ERROR] ' + message));
    },
    warn: function warn(message) {
      this.write(_warn('[WARN] ' + message));
    },
    info: function info(message) {
      this.write(_info('[INFO] ' + message));
    },
    debug: function debug(message) {
      this.write(_debug('[DEBUG] ' + message));
    },
    trace: function trace(message) {
      this.write(_trace('[TRACE] ' + message));
    }
  };

  function push(data) {
    var repo = data.repo.name;
    var branch = data.payload.ref.split('/')[2];
    var commit = data.payload.commits[0];
    var name = commit.author.name;
    var message = commit.message;
    var sha = commit.sha.substring(0, 7);
    var url = 'https://github.com/' + repo + '/commit/' + sha;
    var content = '[' + repo + ':' + branch + '] 1 new commit by ' + name + ':';
    content += '\n' + message + ' - ' + name;
    content += '\n' + url;
    return content;
  }

  function pushMulti(data) {
    var repo = data.repo.name;
    var branch = data.payload.ref.split('/')[2];
    var size = data.payload.size;
    var commits = data.payload.commits;

    var content = '[' + repo + ':' + branch + '] ' + size + ' new commits:';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = commits[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var commit = _step.value;

        var sha = commit.sha.substring(0, 7);
        var url = 'https://github.com/' + repo + '/commit/' + sha;
        content += '\n' + commit.message + ' - ' + commit.author.name;
        content += '\n' + url;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return content;
  }

  function createBranch(data) {
    var repo = data.repo.name;
    var branch = data.payload.ref;
    var user = data.actor.login;

    var content = '[' + repo + '] The branch **' + branch + '** was created by ' + user;
    content += '\nhttps://github.com/' + repo + '/tree/' + branch;

    return content;
  }

  function createTag(data) {
    var repo = data.repo.name;
    var tag = data.payload.ref;
    var user = data.actor.login;
    return '[' + repo + '] The tag **' + tag + '** was created by ' + user;
  }

  function deleteBranch(data) {
    var repo = data.repo.name;
    var branch = data.payload.ref;
    var user = data.actor.login;
    return '[' + repo + '] The branch **' + branch + '** was deleted by ' + user;
  }

  function deleteTag(data) {
    var repo = data.repo.name;
    var tag = data.payload.ref;
    var user = data.actor.login;
    return '[' + repo + '] The tag **' + tag + '** was deleted by ' + user;
  }

  function pullRequestOpened(data) {
    var repo = data.repo.name;
    var user = data.payload.pull_request.user.login;
    var head = data.payload.pull_request.head.repo.full_name;
    var headBranch = data.payload.pull_request.head.ref;
    var baseBranch = data.payload.pull_request.base.ref;
    var commits = data.payload.pull_request.commits;
    var additions = data.payload.pull_request.additions;
    var deletions = data.payload.pull_request.deletions;
    var changedFiles = data.payload.pull_request.changed_files;
    var number = data.payload.number;

    var content = '[**' + repo + '**] New pull request from ' + user;
    content += '\n[' + repo + ':' + baseBranch + ' ← ' + head + ':' + headBranch + ']';
    content += '\n' + commits + ' commits • ' + changedFiles + ' changed files • ' + additions + ' additions • ' + deletions + ' deletions';
    content += '\nhttp://github.com/' + repo + '/pull/' + number;

    return content;
  }

  var templates = {
    push: push,
    pushMulti: pushMulti,
    createBranch: createBranch,
    createTag: createTag,
    deleteBranch: deleteBranch,
    deleteTag: deleteTag,
    pullRequestOpened: pullRequestOpened
  };

  var DiscordBotGithub = (function () {
    function DiscordBotGithub(config) {
      babelHelpers.classCallCheck(this, DiscordBotGithub);

      var setup = this.setup.bind(this);
      var start = this.start.bind(this);
      if (process && process.argv.length >= 3) {
        fs.readFile(path.join(__dirname, process.argv[2]), function (err, config) {
          if (err) return out.error(err);
          setup(JSON.parse(config));
          start();
        });
      } else {
        this.setup(JSON.parse(config));
      }
    }

    babelHelpers.createClass(DiscordBotGithub, [{
      key: 'setup',
      value: function setup(config) {
        out.info('setting up' + JSON.stringify(this, null, 2));
        this.config = config;
        this.email = config.email;
        this.password = config.password;
        this.subscriptions = config.subscriptions;
        this.client = new Discord.Client();
        this.token = null;
        this.interval = config.interval;
        this.etags = {};
        this.queue = [];
      }
    }, {
      key: 'start',
      value: function start() {
        var _this = this;

        var client = this.client;
        out.info(client.servers);
        this.client.login(this.email, this.password, function (error) {
          if (error) return out.error('[Login]' + error);

          out.info('Discord GitHub Bot listening for changes...');

          setInterval(_this.loop.bind(_this), _this.interval);
        });
      }
    }, {
      key: 'loop',
      value: function loop() {
        var _this2 = this;

        // Check to see if we have any messages in the queue.
        if (this.queue.length) {
          this.sendQueuedMessages();
        }
        // Check to see if we have any changes in the repositories.
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          var _loop = function _loop() {
            var subscription = _step.value;

            var repo = subscription.repository;
            // If there has been a change, loop through the servers.
            // Else, we want to continue to the next subscription.
            var headers = {
              'Authorization': 'token ' + _this2.config.token
            };
            if (_this2.etags[repo]) {
              headers['If-None-Match'] = _this2.etags[repo];
            }
            axios.get('https://api.github.com/repos/' + repo + '/events', { headers: headers }).then(function (response) {
              return _this2.eventPollSuccess(response, subscription);
            }).catch(_this2.eventPollFailure);
          };

          for (var _iterator = this.subscriptions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }, {
      key: 'eventPollSuccess',
      value: function eventPollSuccess(response, subscription) {
        if (response.status !== 200) {
          out.error('Wrong response code. Expected 200 and got ' + response.status);
          return;
        }

        if (!response.headers) {
          out.error('No headers found');
          return;
        }

        if (!response.headers.etag) {
          out.error('No etag header found');
          return;
        }

        if (!response.data.length) {
          out.error('No data found');
          return;
        }

        if (this.etags[subscription.repository]) {
          var data = response.data[0];
          out.info('Something has changed!');
          // Loop through the servers and send messages to the correct channels
          // given that the event is being traked by said channel.
          // @note: triple for-loop?
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = subscription.servers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var server = _step2.value;
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = server.channels[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var channel = _step3.value;
                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                    for (var _iterator4 = channel.events[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var eventType = _step4.value;

                      if (eventType === data.type.replace('Event', '')) {
                        // Event type is being tracked by this channel...
                        // Queue this message for sending
                        this.queue.push({
                          id: server.id,
                          name: channel.name,
                          content: this.constructMessage(data)
                        });
                      }
                    }
                  } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                      }
                    } finally {
                      if (_didIteratorError4) {
                        throw _iteratorError4;
                      }
                    }
                  }
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }

        this.etags[subscription.repository] = response.headers.etag;
      }
    }, {
      key: 'eventPollFailure',
      value: function eventPollFailure(error) {
        if (error.status === 304) {
          return;
        }

        out.error(error);
      }
    }, {
      key: 'sendQueuedMessages',
      value: function sendQueuedMessages() {
        while (this.queue.length) {
          var message = this.queue.shift();
          this.sendMessage(message.id, message.name, message.content);
        }
      }
    }, {
      key: 'sendMessage',
      value: function sendMessage(id, name, content) {
        // Get the channel ID
        var channelResolvable = this.getChannelResolvable(id, name);
        // Send the message
        this.client.sendMessage(channelResolvable, content, {}, function (error) {
          if (error) {
            out.error('Error sending message');
            out.error(error);
          }
        });
      }
    }, {
      key: 'constructMessage',
      value: function constructMessage(data) {
        switch (data.type) {
          case 'PushEvent':
            if (data.payload.size === 1) {
              return templates.push(data);
            }
            return templates.pushMulti(data);
          case 'CreateEvent':
            if (data.payload.ref_type === 'branch') {
              return templates.createBranch(data);
            } else if (data.payload.ref_type === 'tag') {
              return templates.createTag(data);
            }
            break;
          case 'DeleteEvent':
            if (data.payload.ref_type === 'branch') {
              return templates.deleteBranch(data);
            } else if (data.payload.ref_type === 'tag') {
              return templates.deleteTag(data);
            }
            break;
          case 'PullRequestEvent':
            if (data.payload.action === 'opened') {
              return templates.pullRequestOpened(data);
            }
            break;
          default:
            return 'Message!';
        }
      }
    }, {
      key: 'getChannelResolvable',
      value: function getChannelResolvable(id, name) {
        out.info(this.client.servers, null, 2);
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = this.client.servers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var server = _step5.value;

            if (server.id === id) {
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                for (var _iterator6 = server.channels[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                  var channel = _step6.value;

                  if (channel.type === 'text' && channel.name === name) {
                    return channel.id;
                  }
                }
              } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                  }
                } finally {
                  if (_didIteratorError6) {
                    throw _iteratorError6;
                  }
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }
    }, {
      key: 'logServers',
      value: function logServers() {
        out.info(this.client.servers);
      }
    }, {
      key: 'on',
      value: function on(e, f) {
        this.client.on(e, f);
      }
    }]);
    return DiscordBotGithub;
  })();

  var index = new DiscordBotGithub();

  return index;

}));