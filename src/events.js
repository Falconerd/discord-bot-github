export default class Events {
  static commit_comment(data) {
    let message = "";
    const repo = data.repository.full_name;
    const commit = data.comment.commit_id.substring(0, 7);
    const user = data.comment.user.login;
    message += `[**${repo} _${commit}_**] New comment on commit by ${user}`;
    message += `\n${data.comment.body}`;
    return message;
  }

  static create(data) {
    const type = data.ref_type;
    const repo = data.repository.full_name;
    const user = data.sender.login;
    return `[**${repo}**] ${user} created a ${type}: ${data.ref}`;
  }

  static delete(data) {
    const type = data.ref_type;
    const repo = data.repository.full_name;
    const user = data.sender.login;
    return `[**${repo}**] ${user} deleted a ${type}: ${data.ref}`;
  }

  static deployment(data) {
    return null;
  }

  static deployment_status(data) {
    return null;
  }

  static fork(data) {
    const repo = data.repository.full_name;
    const fork = data.forkee.full_name;
    return `[**${repo}**] -> *${fork}*\nFork created.`;
  }

  static gollum(data) {
    const repo = data.repository.full_name;
    const user = data.sender.login;
    const pages = data.pages;
    let message = `[**${repo}**] Wiki was updated by ${user}.`;
    pages.forEach(page => message += `\n**${page.title}:** ${page.action}`);
    return message;
  }

  static issue_comment(data) {
    const repo = data.repository.full_name;
    const user = data.comment.user.login;
    const url = data.comment.html_url;
    const body = data.comment.body;
    const title = data.issue.title;
    let message = `[**${repo}**] Comment created on issue: ${title} by ${user}`;
    message += `\n${url}`;
    message += `\n${body}`;
    return message;
  }

  static issues(data) {
    const repo = data.repository.full_name;
    const action = data.action;
    const user = data.sender.login;
    const url = data.issue.html_url;
    return `[**${repo}**] Issue ${action} by ${user}\n${url}`;
  }

  static member(data) {
    const repo = data.repository.full_name;
    const user = data.member.login;
    const url = data.member.html_url;
    return `[**${repo}**] New collaborator added: ${user}\n${url}`;
  }

  static membership(data) {
    return null;
  }

  static page_build(data) {
    return null;
  }

  static public(data) {
    const repo = data.repository.full_name;
    return `[**${repo}**] Has been made open source!`;
  }

  static pull_request_review_comment(data) {
    const repo = data.repository.full_name;
    const action = data.action;
    const user = data.comment.user.login;
    const body = data.comment.body;
    const url = data.comment.html_url;
    let message = `[**${repo}**] Pull Request comment ${action} by ${user}:`;
    message += `\n${body}`;
    message += `\n${url}`;
    return message;
  }

  static pull_request(data) {
    const repo = data.repository.full_name;
    const action = data.action;
    const user = data.sender.login;
    const body = data.pull_request.body;
    const url = data.pull_request.html_url;
    let message = `[**${repo}**] Pull Request ${action} by ${user}:`;
    message += `\n${body}`;
    message += `\n${url}`;
    return message;
  }

  static push(data) {
    let message = "";
    const repo = data.repository.full_name;
    const branch = data.ref.split("/")[2];
    if (data.commits.length === 1) {
      const commit = data.commits[0];
      const name = commit.author.name;
      const commitMessage = commit.message;
      const sha = commit.id.substring(0, 7);
      const url = `https://github.com/${repo}/commit/${sha}`;
      message += `[**${repo}:${branch}**] 1 new commit by ${name}`;
      message += `\n${commitMessage} - ${name}`;
      message += `\n${url}`;
    } else {
      const commits = data.commits;

      message += `[**${repo}:${branch}**] ${commits.length} new commits`;

      for (let commit of commits) {
        const sha = commit.id.substring(0, 7);
        const url = `https://github.com/${repo}/commit/${sha}`;
        message += `\n${commit.message} - ${commit.author.name}`;
        message += `\n${url}`;
      }
    }
    return message;
  }

  static repository(data) {
    return null;
  }

  static release(data) {
    const repo = data.repository.full_name;
    const user = data.release.author.login;
    const url = data.release.html_url;
    return `[**${repo}**] Release published by ${user}:\n${url}`;
  }

  static status(data) {
    const repo = data.repository.full_name;
    const description = data.description;
    const state = data.state;
    const url = data.target_url;
    const branch = data.branches.length > 0 ? data.branches[0].name : null;
    const commitMsg = data.commit.message;
    return `[**${repo}**] ${description}\n${branch}: ${commitMsg}\nState: ${state} ${url}`;
  }

  static team_add(data) {
    return null;
  }

  static watch(data) {
    const repo = data.repository.full_name;
    const user = data.sender.login;
    return `[**${repo}**] Starred by ${user}`;
  }

  static ping(data) {
    return null;
  }

}
