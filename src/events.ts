export class Events {
  static commit_comment(data) {
    let message: string = "";
    const repo = data.repository.full_name;
    const commit = data.comment.commit_id.substring(0, 7);
    const user = data.comment.user.login;
    message += `[**${repo} _${commit}_**] New comment on commit by ${user}`;
    message += `\n${data.comment.body}`;
    return message;
  }

  static create(data) {
    let message: string = "";
    return message;
  }

  static delete(data) {
    let message: string = "";
    return message;
  }

  static deployment(data) {
    let message: string = "";
    return message;
  }

  static deployment_status(data) {
    let message: string = "";
    return message;
  }

  static fork(data) {
    let message: string = "";
    return message;
  }

  static gollum(data) {
    let message: string = "";
    return message;
  }

  static issue_comment(data) {
    let message: string = "";
    return message;
  }

  static issues(data) {
    let message: string = "";
    return message;
  }

  static member(data) {
    let message: string = "";
    return message;
  }

  static membership(data) {
    let message: string = "";
    return message;
  }

  static page_build(data) {
    let message: string = "";
    return message;
  }

  static public(data) {
    let message: string = "";
    return message;
  }

  static pull_request_review_comment(data) {
    let message: string = "";
    return message;
  }

  static pull_request(data) {
    let message: string = "";
    return message;
  }

  static push(data) {
    let message: string = "";
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
      message += `\n{url}`;
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
    let message: string = "";
    return message;
  }

  static release(data) {
    let message: string = "";
    return message;
  }

  static status(data) {
    let message: string = "";
    return message;
  }

  static team_add(data) {
    let message: string = "";
    return message;
  }

  static watch(data) {
    let message: string = "";
    return message;
  }

}
