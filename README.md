[![Build Status](https://travis-ci.org/Falconerd/discord-bot-github.svg?branch=develop)](https://travis-ci.org/Falconerd/discord-bot-github)
[![codecov](https://codecov.io/gh/Falconerd/discord-bot-github/branch/develop/graph/badge.svg)](https://codecov.io/gh/Falconerd/discord-bot-github)

# discord-bot-github
> A GitHub bot for Discord

_This new version is an authorized Discord bot._

## Setup

1. Add a webhook to your repository pointing to `https://discordbotgithub.herokuapp.com`. Select any events you would like to listen for.
  - To add a webhook, go to your repository on GitHub.
  - Click the settings tab.
  - Click _Webhooks & services_ on the left.
  - Click the _Add Webhook_ button.
  - Add the above URL to the payload URL box.
2. Authorize the bot on your server by clicking [this link](https://discordapp.com/oauth2/authorize?client_id=19000403632128013&scope=bot).
3. Once the bot is added to your server, you can interact with it using the commands listed below.

## Usage

Commands for this bot follow this structure: `!dbg <command> [argument]`.

| Command | Description
|---------|-------------|
| `!dbg add organization/repository` | Subscribes this channel to the given repository. |
| `!dbg remove organization/repository` | Removes this channel's subscription to the given repository. |
| `!dbg help` | Displays usage instructions. |

## Caveats

There is currently no method of preventing unauthorized people from viewing your updates. I assume that is what Webhook secrets are for. I will be implementing this in a later update.
