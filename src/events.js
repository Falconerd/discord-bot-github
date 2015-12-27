const messageTemplates = require('./messageTemplates');

/**
 * Events module.
 * @module events
 */

/** Push event */
exports.push = function(data) {
  if (data.payload.size === 1) {
    return messageTemplates.pushEventSingle(data);
  } else {
    return messageTemplates.pushEventMultiple(data);
  }
};

/** Create event */
exports.create = function(data) {
  if (data.payload.ref_type === 'branch') {
    return messageTemplates.createEventBranch(data);
  } else if (data.payload.ref_type === 'tag') {
    return messageTemplates.createEventTag(data);
  }
};

/** Pull Request event */
exports.pullRequest = function(data) {
  if (data.payload.action === 'opened') {
    return messageTemplates.pullRequestEventOpened(data);
  }
};
