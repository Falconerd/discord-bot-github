# Discord GitHub Bot

> Major breaking changes from 0.1.0 to 0.2.0

> This is the main development branch. All changes will be tested on
> this branch before they are pushed to master.

[![Build Status](https://travis-ci.org/Falconerd/discord-bot-github.svg?branch=dev)](https://travis-ci.org/Falconerd/discord-bot-github) [![Coverage Status](https://coveralls.io/repos/Falconerd/discord-bot-github/badge.svg?branch=dev&service=github)](https://coveralls.io/github/Falconerd/discord-bot-github?branch=dev)

## Requirements

- [Node.js](http://nodejs.org/)
- [npm](http://npmjs.com) (comes bundled with Node.js)

## Usage

### Command line - global

`npm install -g discord-bot-github`

`discord-bot-github /path/to/config.json`

### Command line - local

`mkdir somedirectory`

`npm install --save discord-bot-github`

`node ./node_modules/discord-bot-github config.json`

> config.js[on] (options listed below)

## Features
- [x] Sweet avatar
- [x] Multiple Discord servers
- [x] Multiple Discord channels
- [x] Customise events subscribed to on a per-channel basis
- [ ] Subscribe to users instead of just repositories
- [ ] Electron based configuration wrapper for those who don't like JSON

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

## config.js[on]

> Example

```json
  "interval": 5000,
  "email": "discordgithub@gmail.com",
  "password": "xxxxxxxxxxxxxx",
  "token": "c6c859bd79aa5ad9d88d62247a534e1e76273dcd",
  "avatar": "somebase64image",
  "subscriptions": [
    {
      "repository": "Falconerd/multiply",
      "servers": [
        {
          "id": "125472919223664640",
          "invite": "http://discord.gg/1234567890",
          "channels": [
            {
              "name": "github",
              "events": [
                "Push",
                "PullRequest"
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

| Key | Description
| --- | -----------
| `interval` | Time in milliseconds to check the GitHub API.
| `email` | Discord email associated with your bot's account.
| `password` | Plain text password for your Discord bot's account.
| `token` | GitHub OAuth token generated from your settings.
| `avatar` | Base64 string of an image.
| `subscriptions` | Array of subscriptions. Outlined below.

### Subscriptions
| Key | Description
| --- | -----------
| `repository` | The repository. Must be as such `username/repository`.
| `servers` | The servers in which to post activity of this repository. Outlined below.

### Servers
| Key | Description
| --- | -----------
| `id` | The Discord server ID.
| `invite` | Invite link to the server.
| `channels` | Which channels to post to. Outlined below.

### Channels
| Key | Description
| --- | -----------
| `name` | The name of the channel.
| `events` | Which events to post to this channel.

Events must be of the following: Push, CommitComment, PullRequest, Issues, IssueComment, Create, Delete

> See the Events section above for which events are currently available.
