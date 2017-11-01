[![Build Status](https://travis-ci.org/Falconerd/discord-bot-github.svg?branch=develop)](https://travis-ci.org/Falconerd/discord-bot-github)
[![codecov](https://codecov.io/gh/Falconerd/discord-bot-github/branch/develop/graph/badge.svg)](https://codecov.io/gh/Falconerd/discord-bot-github)

# discord-bot-github - 0.4.7
> A GitHub bot for Discord

## Caution

> tl;dr - Don't use this with private repos if you have a problem with other people possibly (only if they know your user/repo combination) reading your commit messages, issue titles, etc

Currently, there is no method in place to prevent other users from subscribing to your private repositories. If they know of it's existence and you have authorised this bot to listen to your repo's webooks, then anyone can also subscribe to the events.

Here is a sample scenario:

Person A and person B start working on a project together. The project is in a private repository. This bot has been authorised to listen for the project events. At some point, person B leaves the team. Person B creates their own discord server and channel and subscribes to the repository. Since there is no further verification, person B can still see the project's events.

The information is limited to what is displayed in the messages, which is generally the type of event, who triggered the event, and a link.

A push event will display the commit message, which could be a potential security problem for a project.

As of now (2016-18-09) I am unsure of how to go about solving this issue. One possibility I am looking into is using the GitHub Personal Access Tokens. However, for the bot to be able to function properly with private repositories, the tokens would need to be stored in a database which can be accessed by the bot.

Personal Access Tokens have a huge flaw which is that AFAIK they cannot be set to read-only. This would mean that the bot (and by extension, myself) would have write access to any repositories which store a key with the bot. Obviously, this is not acceptable.

Another potential solution is to create a GitHub Integration. I have been looking into the documentation but am not sure how this could be set up to work in an ideal way.

## Setup

1. Add a webhook to your repository pointing to `https://discordbotgithub.herokuapp.com`. Select any events you would like to listen for.
  - To add a webhook, go to your repository on GitHub.
  - Click the settings tab.
  - Click _Webhooks & services_ on the left.
  - Click the _Add Webhook_ button.
  - Add the above URL to the payload URL box.
  - Change the _Content Type_ to _application/json_
2. Authorize the bot on your server by clicking [this link](https://discordapp.com/oauth2/authorize?&client_id=193000403632128013&scope=bot&permissions=3072).
3. Once the bot is added to your server, you can interact with it using the commands listed below.

## Usage

Commands for this bot follow this structure: `!dbg <command> [argument]`.

| Command | Description
|---------|-------------|
| `!dbg add organization/repository` | Subscribes this channel to the given repository. |
| `!dbg remove organization/repository` | Removes this channel's subscription to the given repository. |
| `!dbg help` | Displays usage instructions. |
