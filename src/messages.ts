type Repository = {
  full_name: string;
};

type Sender = {
  login: string;
};

type Forkee = {
  full_name: string;
};

type Page = {
  title: string;
  action: string;
};

type User = {
  login: string;
};

type Comment = {
  commit_id: string;
  user: User;
  body: string;
  html_url: string;
};

type Issue = {
  title: string;
  html_url: string;
};

type Member = {
  login: string;
  html_url: string;
};

type PullRequest = {
  body: string;
  html_url: string;
};

type Author = {
  name: string;
  login: string;
};

type Release = {
  author: Author;
  html_url: string;
};

type Branch = {
  name: string;
};

type Commit = {
  message: string;
  author: Author;
  id: string;
};

type CommitCommentPayload = {
  repository: Repository;
  comment: Comment;
};

function eventCommitComment(payload: CommitCommentPayload): string {
  const repo = payload.repository.full_name;
  const commit = payload.comment.commit_id.substring(0, 7);
  const user = payload.comment.user.login;
  const comment = payload.comment.body;

  return `[**${repo} _${commit}_**] New comment on commit by ${user}\n${comment}`;
}

type CreatePayload = {
  ref_type: string;
  repository: Repository;
  sender: Sender;
  ref: string;
};

function eventCreate(payload: CreatePayload): string {
  const type = payload.ref_type;
  const repo = payload.repository.full_name;
  const user = payload.sender.login;
  const ref = payload.ref;

  return `[**${repo}**] ${user} created a ${type}: ${ref}`;
}

type DeletePayload = {
  ref_type: string;
  repository: Repository;
  sender: Sender;
  ref: string;
};

function eventDelete(payload: DeletePayload): string {
  const type = payload.ref_type;
  const repo = payload.repository.full_name;
  const user = payload.sender.login;
  const ref = payload.ref;

  return `[**${repo}**] ${user} deleted a ${type}: ${ref}`;
}

type ForkPayload = {
  repository: Repository;
  forkee: Forkee;
};

function eventFork(payload: ForkPayload): string {
  const repo = payload.repository.full_name;
  const fork = payload.forkee.full_name;

  return `[**${repo}**] -> *${fork}*\nFork created.`;
}

type GollumPayload = {
  repository: Repository;
  sender: Sender;
  pages: Page[];
};

function eventGollum(payload: GollumPayload): string {
  const repo = payload.repository.full_name;
  const user = payload.sender.login;
  const pages = payload.pages;

  let message = `[**${repo}**] Wiki was updated by ${user}.`;

  pages.forEach((page) => (message += `\n**${page.title}:** ${page.action}`));

  return message;
}

type IssueCommentPayload = {
  repository: Repository;
  comment: Comment;
  issue: Issue;
};

function eventIssueComment(payload: IssueCommentPayload): string {
  const repo = payload.repository.full_name;
  const user = payload.comment.user.login;
  const url = payload.comment.html_url;
  const body = payload.comment.body;
  const title = payload.issue.title;

  return `[**${repo}**] Comment created on issue: ${title} by ${user}\n<${url}>\n${body}`;
}

type IssuesPayload = {
  repository: Repository;
  action: string;
  sender: Sender;
  issue: Issue;
};

function eventIssues(payload: IssuesPayload): string {
  const repo = payload.repository.full_name;
  const action = payload.action;
  const user = payload.sender.login;
  const url = payload.issue.html_url;

  return `[**${repo}**] Issue ${action} by ${user}\n<${url}>`;
}

type MemberPayload = {
  repository: Repository;
  member: Member;
};

function eventMember(payload: MemberPayload): string {
  const repo = payload.repository.full_name;
  const user = payload.member.login;
  const url = payload.member.html_url;

  return `[**${repo}**] New collaborator added: ${user}\n<${url}>`;
}

type PublicPayload = {
  repository: Repository;
};

function eventPublic(payload: PublicPayload): string {
  const repo = payload.repository.full_name;

  return `[**${repo}**] Has been made open source!`;
}

type PullRequestReviewCommentPayload = {
  repository: Repository;
  action: string;
  comment: Comment;
};

function eventPullRequestReviewComment(payload: PullRequestReviewCommentPayload): string {
  const repo = payload.repository.full_name;
  const action = payload.action;
  const user = payload.comment.user.login;
  const body = payload.comment.body;
  const url = payload.comment.html_url;

  return `[**${repo}**] Pull Request comment ${action} by ${user}:\n${body}\n<${url}>`;
}

type PullRequestPayload = {
  repository: Repository;
  action: string;
  sender: Sender;
  pull_request: PullRequest;
};

function eventPullRequest(payload: PullRequestPayload): string {
  const repo = payload.repository.full_name;
  const action = payload.action;
  const user = payload.sender.login;
  const body = payload.pull_request.body;
  const url = payload.pull_request.html_url;

  return `[**${repo}**] Pull Request ${action} by ${user}:\n${body}\n<${url}>`;
}

type PushPayload = {
  repository: Repository;
  commits: Commit[];
  ref: string;
};

function eventPush(payload: PushPayload): string {
  let message = "";
  const repo = payload.repository.full_name;
  const branch = payload.ref.split("/")[2];

  if (payload.commits.length === 1) {
    const commit = payload.commits[0];
    const name = commit.author.name;
    const commitMessage = commit.message;
    const sha = commit.id.substring(0, 7);
    const url = `https://github.com/${repo}/commit/${sha}`;

    message += `[**${repo}:${branch}**] 1 new commit by ${name}`;
    message += `\n${commitMessage} - ${name}`;
    message += `\n<${url}>`;
  } else {
    const commits = payload.commits;

    message += `[**${repo}:${branch}**] ${commits.length} new commits`;

    for (let commit of commits) {
      const sha = commit.id.substring(0, 7);
      const url = `https://github.com/${repo}/commit/${sha}`;

      message += `\n${commit.message} - ${commit.author.name}`;
      message += `\n<${url}>`;
    }
  }

  return message;
}

type ReleasePayload = {
  repository: Repository;
  release: Release;
};

function eventRelease(payload: ReleasePayload): string {
  const repo = payload.repository.full_name;
  const user = payload.release.author.login;
  const url = payload.release.html_url;

  return `[**${repo}**] Release published by ${user}:\n<${url}>`;
}

type StatusPayload = {
  repository: Repository;
  description: string;
  state: string;
  target_url: string;
  branches: Branch[];
  commit: Commit;
};

function eventStatus(payload: StatusPayload): string {
  const repo = payload.repository.full_name;
  const description = payload.description;
  const state = payload.state;
  const url = payload.target_url;
  const branch = payload.branches.length > 0 ? payload.branches[0].name : null;
  const commitMsg = payload.commit.message;

  return `[**${repo}**] ${description}\n${branch}: ${commitMsg}\nState: ${state} <${url}>`;
}

type WatchPayload = {
  repository: Repository;
  sender: Sender;
};

function eventWatch(payload: WatchPayload): string {
  const repo = payload.repository.full_name;
  const user = payload.sender.login;

  return `[**${repo}**] Starred by ${user}`;
}

export function eventToMessage(eventName: string, payload: any) {
  switch (eventName) {
    case "commit_comment":
      return eventCommitComment(payload);
    case "create":
      return eventCreate(payload);
    case "delete":
      return eventDelete(payload);
    case "fork":
      return eventFork(payload);
    case "gollum":
      return eventGollum(payload);
    case "issue_comment":
      return eventIssueComment(payload);
    case "issues":
      return eventIssues(payload);
    case "member":
      return eventMember(payload);
    case "public":
      return eventPublic(payload);
    case "pull_request_review_comment":
      return eventPullRequestReviewComment(payload);
    case "pull_request":
      return eventPullRequest(payload);
    case "push":
      return eventPush(payload);
    case "release":
      return eventRelease(payload);
    case "status":
      return eventStatus(payload);
    case "watch":
      return eventWatch(payload);
  }
  return null;
}
