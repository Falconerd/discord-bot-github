import fs from 'fs';
import chalk from 'chalk';
import Discord from 'discord.js';
import axios from 'axios';

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
  var content = '[**' + repo + ':' + branch + '**] 1 new commit by ' + name + ':';
  content += '\n' + message + ' - ' + name;
  content += '\n' + url;
  return content;
}

function pushMulti(data) {
  var repo = data.repo.name;
  var branch = data.payload.ref.split('/')[2];
  var size = data.payload.size;
  var commits = data.payload.commits;

  var content = '[**' + repo + ':' + branch + '**] ' + size + ' new commits:';
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

  var content = '[**' + repo + '**] The branch **' + branch + '** was created by ' + user;
  content += '\nhttps://github.com/' + repo + '/tree/' + branch;

  return content;
}

function createTag(data) {
  var repo = data.repo.name;
  var tag = data.payload.ref;
  var user = data.actor.login;
  return '[**' + repo + '**] The tag **' + tag + '** was created by ' + user;
}

function deleteBranch(data) {
  var repo = data.repo.name;
  var branch = data.payload.ref;
  var user = data.actor.login;
  return '[**' + repo + '**] The branch **' + branch + '** was deleted by ' + user;
}

function deleteTag(data) {
  var repo = data.repo.name;
  var tag = data.payload.ref;
  var user = data.actor.login;
  return '[**' + repo + '**] The tag **' + tag + '** was deleted by ' + user;
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
  content += '\nhttps://github.com/' + repo + '/pull/' + number;

  return content;
}

function pullRequestClosed(data) {
  var repo = data.repo.name;
  var actor = data.actor.login;
  var user = data.payload.pull_request.user.login;
  var head = data.payload.pull_request.head.repo.full_name;
  var headBranch = data.payload.pull_request.head.ref;
  var baseBranch = data.payload.pull_request.base.ref;
  var commits = data.payload.pull_request.commits;
  var additions = data.payload.pull_request.additions;
  var deletions = data.payload.pull_request.deletions;
  var changedFiles = data.payload.pull_request.changed_files;
  var number = data.payload.number;

  var content = '[**' + repo + '**] Pull request by ' + user + ' closed by ' + actor + ':';
  content += '\n[' + repo + ':' + baseBranch + ' ← ' + head + ':' + headBranch + ']';
  content += '\n' + commits + ' commits • ' + changedFiles + ' changed files • ' + additions + ' additions • ' + deletions + ' deletions';
  content += '\nhttps://github.com/' + repo + '/pull/' + number;

  return content;
}

function pullRequestRepoened(data) {
  var repo = data.repo.name;
  var actor = data.actor.login;
  var user = data.payload.pull_request.user.login;
  var head = data.payload.pull_request.head.repo.full_name;
  var headBranch = data.payload.pull_request.head.ref;
  var baseBranch = data.payload.pull_request.base.ref;
  var commits = data.payload.pull_request.commits;
  var additions = data.payload.pull_request.additions;
  var deletions = data.payload.pull_request.deletions;
  var changedFiles = data.payload.pull_request.changed_files;
  var number = data.payload.number;

  var content = '[**' + repo + '**] Pull request by ' + user + ' reopened by ' + actor + ':';
  content += '\n[' + repo + ':' + baseBranch + ' ← ' + head + ':' + headBranch + ']';
  content += '\n' + commits + ' commits • ' + changedFiles + ' changed files • ' + additions + ' additions • ' + deletions + ' deletions';
  content += '\nhttps://github.com/' + repo + '/pull/' + number;

  return content;
}

function issueCommentCreated(data) {
  var url = data.payload.comment.html_url;
  var repo = data.repo.name;
  var actor = data.actor.login;
  var title = data.payload.issue.title;

  var content = '[**' + repo + '**] New comment on issue:';
  content += '\n*' + title + '* by *' + actor + '*';
  content += '\n' + url;

  return content;
}

function issueOpened(data) {
  var url = data.payload.issue.html_url;
  var repo = data.repo.name;
  var actor = data.actor.login;
  var title = data.payload.issue.title;

  var content = '[**' + repo + '**] Issue opened by ' + actor + ':';
  content += '\n*' + title + '*';
  content += '\n' + url;

  return content;
}

function issueClosed(data) {
  var url = data.payload.issue.html_url;
  var repo = data.repo.name;
  var actor = data.actor.login;
  var title = data.payload.issue.title;

  var content = '[**' + repo + '**] Issue closed by ' + actor + ':';
  content += '\n*' + title + '*';
  content += '\n' + url;

  return content;
}

function issueReopened(data) {
  var url = data.payload.issue.html_url;
  var repo = data.repo.name;
  var actor = data.actor.login;
  var title = data.payload.issue.title;

  var content = '[**' + repo + '**] Issue reopened by ' + actor + ':';
  content += '\n*' + title + '*';
  content += '\n' + url;

  return content;
}

var templates = {
  push: push,
  pushMulti: pushMulti,
  createBranch: createBranch,
  createTag: createTag,
  deleteBranch: deleteBranch,
  deleteTag: deleteTag,
  pullRequestOpened: pullRequestOpened,
  pullRequestClosed: pullRequestClosed,
  pullRequestRepoened: pullRequestRepoened,
  issueCommentCreated: issueCommentCreated,
  issueOpened: issueOpened,
  issueClosed: issueClosed,
  issueReopened: issueReopened
};

/**
 * Simple helper function to check if a thing is in an array.
 * @param  {Array} array The array to check.
 * @param  {any} thing The thing to check for.
 * @return {Boolean}       True if the thing is in the array, false otherwise.
 */
function contains (array, thing) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = array[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var el = _step.value;

      if (el === thing) {
        return true;
      }
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

  return false;
}

var DiscordBotGithub = (function () {
  function DiscordBotGithub(config) {
    babelHelpers.classCallCheck(this, DiscordBotGithub);

    this.config = config;
    this.email = config.email;
    this.password = config.password;
    this.subscriptions = config.subscriptions;
    this.client = new Discord.Client();
    this.client.on('ready', this.ready.bind(this));
    this.token = null;
    this.interval = config.interval;
    this.etags = {};
    this.queue = [];
  }

  babelHelpers.createClass(DiscordBotGithub, [{
    key: 'start',
    value: function start() {
      this.client.login(this.email, this.password, function (error) {
        if (error) return out.error('[Login]' + error);
      });
    }
  }, {
    key: 'ready',
    value: function ready() {
      out.info('Discord GitHub Bot listening for changes...');
      this.connectToServers();
      setInterval(this.loop.bind(this), this.interval);
    }
  }, {
    key: 'connectToServers',
    value: function connectToServers() {
      var _this = this;

      var connectedServers = [];

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.client.servers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var server = _step.value;

          connectedServers.push(server.id);
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

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.subscriptions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var subscription = _step2.value;
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            var _loop = function _loop() {
              var server = _step3.value;

              if (!contains(connectedServers, server.id)) {
                if (server.invite) {
                  _this.client.joinServer(server.invite, function (error) {
                    if (error) out.error('Could not connect to server with id: ' + server.id);
                  });
                }
              }
            };

            for (var _iterator3 = subscription.servers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              _loop();
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
  }, {
    key: 'loop',
    value: function loop() {
      var _this2 = this;

      // Check to see if we have any messages in the queue.
      if (this.queue.length) {
        this.sendQueuedMessages();
      }
      // Check to see if we have any changes in the repositories.
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        var _loop2 = function _loop2() {
          var subscription = _step4.value;

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

        for (var _iterator4 = this.subscriptions[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          _loop2();
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
  }, {
    key: 'eventPollSuccess',
    value: function eventPollSuccess(response, subscription) {
      out.info(JSON.stringify(response));
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
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = subscription.servers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _server = _step5.value;
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
              for (var _iterator6 = _server.channels[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var channel = _step6.value;
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                  for (var _iterator7 = channel.events[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var eventType = _step7.value;

                    if (eventType === data.type.replace('Event', '')) {
                      // Event type is being tracked by this channel...
                      // Queue this message for sending
                      this.queue.push({
                        id: _server.id,
                        name: channel.name,
                        content: this.constructMessage(data)
                      });
                    }
                  }
                } catch (err) {
                  _didIteratorError7 = true;
                  _iteratorError7 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                      _iterator7.return();
                    }
                  } finally {
                    if (_didIteratorError7) {
                      throw _iteratorError7;
                    }
                  }
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

      this.etags[subscription.repository] = response.headers.etag;
    }
  }, {
    key: 'eventPollFailure',
    value: function eventPollFailure(error) {
      if (error.status === 304) {
        return;
      }

      if (error.status === 401) {
        out.error('Problem with GitHub authentication. Check your API token.');
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
          } else if (data.payload.action === 'reopened') {
            return templates.pullRequestRepoened(data);
          } else if (data.payload.action === 'closed') {
            return templates.pullRequestClosed(data);
          }
          break;
        case 'IssueCommentEvent':
          if (data.payload.action === 'created') {
            return templates.issueCommentCreated(data);
          }
          break;
        case 'IssuesEvent':
          if (data.payload.action === 'opened') {
            return templates.issueOpened(data);
          } else if (data.payload.action === 'reopened') {
            return templates.issueReopened(data);
          } else if (data.payload.action === 'closed') {
            return templates.issueClosed(data);
          }
          break;
        default:
          return 'This event has not yet been implemented (' + data.type + ')';
      }
    }
  }, {
    key: 'getChannelResolvable',
    value: function getChannelResolvable(id, name) {
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = this.client.servers[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _server2 = _step8.value;

          if (_server2.id === id) {
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
              for (var _iterator9 = _server2.channels[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                var channel = _step9.value;

                if (channel.type === 'text' && channel.name === name) {
                  return channel.id;
                }
              }
            } catch (err) {
              _didIteratorError9 = true;
              _iteratorError9 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion9 && _iterator9.return) {
                  _iterator9.return();
                }
              } finally {
                if (_didIteratorError9) {
                  throw _iteratorError9;
                }
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
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

if (process && process.argv.length >= 3) {
  fs.readFile(process.argv[2], function (err, config) {
    if (err) return out.error(err);
    var bot = new DiscordBotGithub(JSON.parse(config));
    bot.start();
  });
}