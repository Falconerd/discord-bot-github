function push(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref.split('/')[2];
  const commit = data.payload.commits[0];
  const name = commit.author.name;
  const message = commit.message;
  const sha = commit.sha;
  const url = `https://github.com/${repo}/commit/${sha}`;
  let content = `[${repo}:${branch}] 1 new commit by ${name}:`;
  content += `\n${message} - ${name}`;
  content += `\n${url}`;
  return content;
}

function pushMulti(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref.split('/')[2];
  const size = data.payload.size;
  const commits = data.payload.commits;

  let content = `[${repo}:${branch}] ${size} new commits:`;
  for (let commit of commits) {
    content += `\n${commit.message} - ${commit.author.name}`;
    content += `\n${commit.url}`;
  }

  return content;
}

function createBranch(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref;
  const user = data.actor.login;

  let content = `[${repo}] The branch **${branch}** was created by ${user}`;
  content += `\nhttps://github.com/${repo}/tree/${branch}`;

  return content;
}

function createTag(data) {
  const repo = data.repo.name;
  const tag = data.payload.ref;
  const user = data.actor.login;
  return `[${repo}] The tag **${tag}** was created by ${user}`;
}

function deleteBranch(data) {
  const repo = data.repo.name;
  const branch = data.payload.ref;
  const user = data.actor.login;
  return `[${repo}] The branch **${branch}** was deleted by ${user}`;
}

function deleteTag(data) {
  const repo = data.repo.name;
  const tag = data.payload.ref;
  const user = data.actor.login;
  return `[${repo}] The tag **${tag}** was deleted by ${user}`;
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
  content += `\nhttp://github.com/Falconerd/multiply/pulls/${number}`;

  return content;
}

export default {
  push,
  pushMulti,
  createBranch,
  createTag,
  deleteBranch,
  deleteTag,
  pullRequestOpened
};
