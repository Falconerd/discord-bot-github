import express from "express";
import bodyParser from "body-parser";
import Discord from "discord.js";
import { Message } from "discord.js";
import { MongoClient } from "mongodb";
import Commands from "./commands";
import Events from "./events";
import config from "./config";

const app = express();
const bot = new Discord.Client();

const mongo_client = new MongoClient(config.db);

app.use(bodyParser.json());

// webhook POST -> construct message -> send message
app.post("/", handleRequest);
app.post("/:guildId", handleRequest);

function handleRequest(req, res) {
  // @TODO Verify that this request came from GitHub
  const event = req.get("X-GitHub-Event");
  if (event) {
    if (typeof Events[event] !== "function") {
        console.error(`Event type '${event}' is not handled.`);
        console.dir({req, res, event});
    }
    const message = Events[event](req.body);
    const repo = req.body.repository.full_name.toLowerCase();
    try {
      sendMessages(repo, message, req.params.guildId);
      res.sendStatus(200);
    } catch (e) {
      console.error("ERROR SENDING MESSAGES:", e);
    }
  } else {
    res.sendStaus(400);
  }
}

app.get("/", (req, res) => {
  res.send(
    "This address is not meant to be accessed by a web browser. Please read the readme on GitHub at https://github.com/falconerd/discord-bot-github"
  );
});

async function sendMessages(repo, message, guildId) {
  const db = mongo_client.db("discobot");
  const collection = db.collection("subscriptions");
  const query = { repo };
  const cursor = collection.find(query);

  if ((await cursor.count()) === 0) {
    console.log("No documents found!");
  }

  await cursor.forEach((res) => {
    const { repo, channelId } = res;
    if (!repo || !channelId) {
      console.error("Malformed data came back from the database", {
        repo,
        channelId,
      });
      return;
    }

    const channel = bot.channels.find("id", channelId);
    if (channel) {
      if (guildId != null && channel.guild_id !== guildId) {
        // If guild ID doesn't match, silently drop the request as it can
        // notify 'something is happening' to malicious users
        return;
      }
      channel.sendMessage(message);
    } else {
      console.log("Error: Bot not allowed in channel");
    }
  });
}

// discord message event -> parseMessage -> Command -> Action
/**
 * Check to see if any message read by this bot is relevant.
 * - Do nothing if the message is from the bot itself.
 * - Check if the message is prefaced with '!dbg'.
 * - If the command is prefaced, check if the command exists.
 * - Then perform the action sepcified.
 */
bot.on("message", (message) => {
  if (message.author.id === bot.user.id) return;
  if (message.content.substring(0, 4) !== "!dbg") return;

  const commandObject = parseMessage(message);
  if (commandObject) {
    Commands[commandObject.command](
      message.channel,
      mongo_client,
      ...commandObject.args
    );
  } else {
    message.reply("Command invalid.");
    Commands["help"](message.channel);
  }
});

/**
 * Take in the content of a message and return a command
 * @param  {Message} message The Discord.Message object
 * @return {Object}          An object continaing a command name and arguments
 */
function parseMessage(message) {
  const parts = message.content.split(" ");
  const command = parts[1];
  const args = parts.slice(2);

  if (typeof Commands[command] === "function") {
    // @TODO We could check the command validity here
    return { command, args };
  } else {
    return null;
  }
}

app.listen(process.env.PORT || 8080, async () => {
  console.log("Started on port", process.env.PORT || 8080);
  try {
    const discord_res = await bot.login(config.token);
    console.log("Logged in to Discord.");
    const mongo_res = await mongo_client.connect();
    console.log("Logged in to MongoDB.");
  } catch (e) {
    console.error(e);
  }
});
