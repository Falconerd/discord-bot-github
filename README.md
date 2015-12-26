# discord-bot-github
A bot for discord which consumes the GitHub API and gives you updates.

## Preview

![GitHub bot in Discord](http://i.imgur.com/hjwC1UG.png)

## Requirements

- NodeJs
- NPM

## Setup

- `mv config.example.js config.js`
- Edit confiuration file to suit your needs. See config section below.
- `git clone https://github.com/Falconerd/discord-bot-github.git`
- `cd discord-bot-github`
- `node .`

## Features
- [x] Sweet avatar
- [x] Multiple Discord servers (Needs testing)
- [x] Multiple Discord channels (Needs testing)
- [x] Customise events subscribed to on a per-channel basis (Needs testing)
- [ ] Subscribe to users instead of just repositories
- [ ] Electron based configuration wrapper for those who don't like JSON
- [ ] NPM version

## Events
- [ ] __CommitCommentEvent__ - Triggered when a commit comment is created.
- [ ] __CreateEvent__ - Represents a created repository, branch, or tag.
  - [ ] Repository
  - [x] Branch
  - [x] Tag
- [ ] __DeleteEvent__ - Represents a deleted branch or tag.
  - [x] Branch
  - [x] Tag
- [ ] __DeploymentEvent__ - Represents a deployment.
- [ ] __DeploymentStatusEvent__ - Represents a deployment status.
- [ ] __ForkEvent__ - Triggered when a user forks a repository.
- [ ] __GollumEvent__ - Triggered when a Wiki page is created or updated.
- [ ] __IssueCommentEvent__ - Triggered when an issue comment is created on an issue or pull request.
- [ ] __IssuesEvent__ - Triggered when an issue is assigned, unassigned, labeled, unlabeled, opened, closed, or reopened.
- [ ] __MemberEvent__ - Triggered when a user is added as a collaborator to a repository.
- [ ] __MembershipEvent__ - Triggered when a user is added or removed from a team.
- [ ] __PageBuildEvent__ - Represents an attempted build of a GitHub Pages site, whether successful or not.
- [ ] __PublicEvent__ - Triggered when a private repository is open sourced. Without a doubt: the best GitHub event.
- [ ] __PullRequestEvent__ - Triggered when a pull request is assigned, unassigned, labeled, unlabeled, opened, closed, reopened, or synchronized.
  - [ ] Assigned
  - [ ] Unassigned
  - [ ] Labeled
  - [ ] Unlabeled
  - [x] Opened
  - [ ] Closed
  - [ ] Reopened
  - [ ] Synchronized
- [ ] __PullRequestReviewCommentEvent__ - Triggered when a comment is created on a portion of the unified diff of a pull request.
- [x] __PushEvent__ - Triggered when a repository branch is pushed to.
- [ ] __ReleaseEvent__ - Triggered when a release is published.
- [ ] __RepositoryEvent__ - Triggered when a repository is created.
- [ ] __StatusEvent__ - Triggered when the status of a Git commit changes.
- [ ] __TeamAddEvent__ - Triggered when a repository is added to a team.Triggered when a repository is added to a team.
- [ ] __WatchEvent__ - The WatchEvent is related to starring a repository, not watching.

## Config

| Key                | Description
| ------------------ | -----------
| `interval`         | Time in milliseconds to check the GitHub API.
| `google.key`       | API Key for Google URL Shortening. This is used because Discord has no built-in url masking :(
| `discord.email`    | Discord email account associted with your bot account.
| `discord.password` | Discord password for bot account.
| `discord.avatar`   | Base64 string of an image. Default is GitHub's Octocat in colour.
| `subscriptions`    |  Array of subscriptions. Each subscription is made up of several parts outlined below.

### Subscriptions

| Key            | Description
| -------------- | -----------
| `server_id`    | The discord server ID. You can obtain this from Discord's settings under Server Settings > Widgets.
| `channel_name` | The name of the channel to post to. Note: If two channels are named the same, it will choose the first one it finds.
| `invite`       | An invite link to your server from Discord.
| `repositories` | Array of repositories to monitor. Each repository is made up of several parts outlined below.

### Repositories

| Key            | Description
| ---------| -----------
| `user`   | Github username.
| `name`   | Repository name.
| `events` | Array of events to subscribe to for this repository. Available events are listed below.

Push, CommitComment, PullRequest, Issues, IssueComment, Create, Delete

> Although these events are in the sample config they may not be ready yet. See the Events section above.
