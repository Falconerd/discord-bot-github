'use strict';

function createUrl(repo, sha) {
  return `https://github.com/${repo}/commit/${sha}`;
}

// -----------------------------------------------------------------------------
// PUSH EVENT
// -----------------------------------------------------------------------------

exports.pushEventSingle = function(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref.split('/')[2];
  const author = data.payload.commits[0].author.name;
  const message = data.payload.commits[0].message;

  let text = `[${repo}:${branch}] 1 new commit by ${author}:`;
  text += `#{0}: ${message} - ${author}`;

  return {
    text,
    urls: [ createUrl(repo, data.payload.commits[0].sha) ]
  };
};

exports.pushEventMultiple = function(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref.split('/')[2];
  const size = data.payload.size;

  let text = `[${repo}:${branch}] ${size} new commits.`;
  const urls = [];

  for (let i = 0; i < data.payload.commits.length; i++) {
    const commit = data.payload.commits[i];
    const message = commit.message;
    const author = commit.author.name;
    text += `\n#{${i}}: ${message} - ${author}`;

    urls.push(createUrl(repo, commit.sha));
  }

  return {
    text,
    urls
  };
};

// -----------------------------------------------------------------------------
// CREATE EVENT
// -----------------------------------------------------------------------------

exports.createEventBranch = function(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref;
  const user = data.actor.login;

  return {
    text: `[${repo}] The branch **${branch}** was created by ${user}
https://github.com/${repo}/tree/${branch}`
  };
};

exports.createEventTag = function(data) {
  const repo = data.repo.name;
  const tag = data.payload.ref;
  const user = data.actor.login;
  return { text: `[${repo}] The tag **${tag}** was created by ${user}` };
};

// -----------------------------------------------------------------------------
// DELETE EVENT
// -----------------------------------------------------------------------------

exports.deleteEventBranch = function(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref;
  const user = data.actor.login;
  return { text: `[${repo}] The branch **${branch}** was deleted by ${user}` };
};

exports.deleteEventTag = function(data) {
  const repo = data.repo.name;
  const tag = data.payload.ref;
  const user = data.actor.login;
  return { text: `[${repo}] The tag **${tag}** was deleted by ${user}` };
};

// -----------------------------------------------------------------------------
// PULL REQUEST EVENT
// -----------------------------------------------------------------------------

exports.pullRequestEventOpened = function(data) {
  const repo = data.repo.name;
  const user = data.payload.pull_request.user.login;
  const head = data.payload.pull_request.head.repo.full_name;
  const headBranch = data.payload.pull_request.head.ref;
  const baseBranch = data.payload.pull_request.base.ref;
  const commits = data.payload.pull_request.commits;
  const additions = data.payload.pull_request.additions;
  const deletions = data.payload.pull_request.deletions;
  const changedFiles = data.payload.pull_request.changed_files;
  const number = data.payload.number;
  return {
    text: `[**${repo}**] New pull request from ${user}
[${repo}:${baseBranch} ← ${head}:${headBranch}]
${commits} commits • ${changedFiles} changed files • ${additions} additions • ${deletions} deletions
#{0}`,
    urls: [ `https://github.com/${repo}/pull/${number}` ]
  };
};
