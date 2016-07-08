function push(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref.split('/')[2];
  const commit = data.payload.commits[0];
  const name = commit.author.name;
  const message = commit.message;
  const sha = commit.sha.substring(0, 7);
  const url = `https://github.com/${repo}/commit/${sha}`;
  let content = `[**${repo}:${branch}**] 1 new commit by ${name}:`;
  content += `\n${message} - ${name}`;
  content += `\n${url}`;
  return content;
}

function pushMulti(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref.split('/')[2];
  const size = data.payload.size;
  const commits = data.payload.commits;

  let content = `[**${repo}:${branch}**] ${size} new commits:`;
  for (let commit of commits) {
    const sha = commit.sha.substring(0, 7);
    const url = `https://github.com/${repo}/commit/${sha}`;
    content += `\n${commit.message} - ${commit.author.name}`;
    content += `\n${url}`;
  }

  return content;
}

function createBranch(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref;
  const user = data.actor.login;

  let content = `[**${repo}**] The branch **${branch}** was created by ${user}`;
  content += `\nhttps://github.com/${repo}/tree/${branch}`;

  return content;
}

function createTag(data) {
  const repo = data.repo.name;
  const tag = data.payload.ref;
  const user = data.actor.login;
  return `[**${repo}**] The tag **${tag}** was created by ${user}`;
}

function deleteBranch(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref;
  const user = data.actor.login;
  return `[**${repo}**] The branch **${branch}** was deleted by ${user}`;
}

function deleteTag(data) {
  const repo = data.repo.name;
  const tag = data.payload.ref;
  const user = data.actor.login;
  return `[**${repo}**] The tag **${tag}** was deleted by ${user}`;
}

function pullRequestOpened(data) {
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

  let content = `[**${repo}**] New pull request from ${user}`;
  content += `\n[${repo}:${baseBranch} ← ${head}:${headBranch}]`;
  content += `\n${commits} commits • ${changedFiles} changed files • ${additions} additions • ${deletions} deletions`;
  content += `\nhttps://github.com/${repo}/pull/${number}`;

  return content;
}

function pullRequestClosed(data) {
  const repo = data.repo.name;
  const actor = data.actor.login;
  const user = data.payload.pull_request.user.login;
  const head = data.payload.pull_request.head.repo.full_name;
  const headBranch = data.payload.pull_request.head.ref;
  const baseBranch = data.payload.pull_request.base.ref;
  const commits = data.payload.pull_request.commits;
  const additions = data.payload.pull_request.additions;
  const deletions = data.payload.pull_request.deletions;
  const changedFiles = data.payload.pull_request.changed_files;
  const number = data.payload.number;

  let content = `[**${repo}**] Pull request by ${user} closed by ${actor}:`;
  content += `\n[${repo}:${baseBranch} ← ${head}:${headBranch}]`;
  content += `\n${commits} commits • ${changedFiles} changed files • ${additions} additions • ${deletions} deletions`;
  content += `\nhttps://github.com/${repo}/pull/${number}`;

  return content;
}

function pullRequestRepoened(data) {
  const repo = data.repo.name;
  const actor = data.actor.login;
  const user = data.payload.pull_request.user.login;
  const head = data.payload.pull_request.head.repo.full_name;
  const headBranch = data.payload.pull_request.head.ref;
  const baseBranch = data.payload.pull_request.base.ref;
  const commits = data.payload.pull_request.commits;
  const additions = data.payload.pull_request.additions;
  const deletions = data.payload.pull_request.deletions;
  const changedFiles = data.payload.pull_request.changed_files;
  const number = data.payload.number;

  let content = `[**${repo}**] Pull request by ${user} reopened by ${actor}:`;
  content += `\n[${repo}:${baseBranch} ← ${head}:${headBranch}]`;
  content += `\n${commits} commits • ${changedFiles} changed files • ${additions} additions • ${deletions} deletions`;
  content += `\nhttps://github.com/${repo}/pull/${number}`;

  return content;
}

function commitCommentCreated(data) {
  const url = data.payload.comment.html_url;
  const repo = data.repo.name;
  const actor = data.actor.login;
  const commitId = data.payload.comment.commit_id;

  let content = `[**${repo}**] New comment on commit:`;
  content += `\n*${commitId.substring(0,10)}* by *${actor}*`;
  content += `\n${url}`;

  return content;
}

function issueCommentCreated(data) {
  const url = data.payload.comment.html_url;
  const repo = data.repo.name;
  const actor = data.actor.login;
  const title = data.payload.issue.title;

  let content = `[**${repo}**] New comment on issue:`;
  content += `\n*${title}* by *${actor}*`;
  content += `\n${url}`;

  return content;
}

function issueOpened(data) {
  const url = data.payload.issue.html_url;
  const repo = data.repo.name;
  const actor = data.actor.login;
  const title = data.payload.issue.title;

  let content = `[**${repo}**] Issue opened by ${actor}:`;
  content += `\n*${title}*`;
  content += `\n${url}`;

  return content;
}

function issueClosed(data) {
  const url = data.payload.issue.html_url;
  const repo = data.repo.name;
  const actor = data.actor.login;
  const title = data.payload.issue.title;

  let content = `[**${repo}**] Issue closed by ${actor}:`;
  content += `\n*${title}*`;
  content += `\n${url}`;

  return content;
}


function issueReopened(data) {
  const url = data.payload.issue.html_url;
  const repo = data.repo.name;
  const actor = data.actor.login;
  const title = data.payload.issue.title;

  let content = `[**${repo}**] Issue reopened by ${actor}:`;
  content += `\n*${title}*`;
  content += `\n${url}`;

  return content;
}

export default {
  push,
  pushMulti,
  createBranch,
  createTag,
  deleteBranch,
  deleteTag,
  pullRequestOpened,
  pullRequestClosed,
  pullRequestRepoened,
  commitCommentCreated,
  issueCommentCreated,
  issueOpened,
  issueClosed,
  issueReopened
};
