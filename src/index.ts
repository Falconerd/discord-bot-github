import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Client, Intents, TextChannel, Permissions, CommandInteraction } from "discord.js";
import { MongoClient } from "mongodb";
import Hapi from "@hapi/hapi";
import hmacSHA256 from "crypto-js/hmac-sha256";
import { fixedTimeComparison } from "@hapi/cryptiles";
import { eventToMessage } from "./messages";
import { commands, add, remove } from "./commands";

type Request = {
  headers: {
    "x-github-event": string;
    "x-hub-signature-256"?: string;
  };
  payload: {
    repository: {
      full_name: string;
    };
  };
};

const { DB_URL, DB_NAME, TOKEN, CLIENT_ID = "", PORT } = process.env;

if (!DB_URL) process.exit(600);
if (!DB_NAME) process.exit(601);
if (!TOKEN) process.exit(602);
if (!CLIENT_ID) process.exit(603);

const mongodbClient = new MongoClient(DB_URL);
const db = mongodbClient.db(DB_NAME);
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });
const rest = new REST({ version: "9" }).setToken(TOKEN);

function repoFromInteraction(interaction: CommandInteraction): string {
  const org = interaction.options.getString("org");
  const name = interaction.options.getString("name");
  return `${org}/${name}`.toLowerCase();
}

function sanitize(text: string) {
  return text.replace("@", "(at)");
}

// Handle use of discord slash commands.
discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  await interaction.deferReply();

  const db = mongodbClient.db(DB_NAME);
  const subscriptions = db.collection("subscriptions");

  try {
    const repo = repoFromInteraction(interaction);
    const { channelId } = interaction;
    const secret = interaction.options.getString("secret");

    switch (interaction.commandName) {
      case "dbg-add":
        if (await add(repo, channelId, subscriptions, secret)) {
          await interaction.editReply(`Subscribed to ${repo}${secret ? " using a secret" : ""}.`);
        } else {
          await interaction.editReply("This channel has already subscribed to the repo.");
        }
        break;
      case "dbg-remove":
        await remove(repo, channelId, subscriptions);
        await interaction.editReply(`Unsubscribed from ${repo}.`);
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("There was some error adding or removing. See below.");
    console.dir(error);
  }
});

async function handleRequest(request: Request) {
  const eventType = request.headers["x-github-event"];
  const signature = request.headers["x-hub-signature-256"];

  const message = eventToMessage(eventType, request.payload);

  if (message) {
    const subscriptions = db.collection("subscriptions");

    const query = { repo: request.payload.repository.full_name.toLowerCase() };

    const res = await subscriptions.find(query).toArray();
    let documents = res;

    if (signature) {
      documents = res.filter((item) => {
        if (!item.secret) {
          return false;
        }

        try {
          const hash = "sha256=" + hmacSHA256(JSON.stringify(request.payload), item.secret).toString();
          return fixedTimeComparison(hash, signature);
        } catch (error) {
          console.log("There was an error during hashing or stringifying the payload. See below.");
          console.dir(error);
          return false;
        }
      });
    }

    const channelIds = documents.map((item) => item.channelId);

    for (let channelId of channelIds) {
      const channel = discordClient.channels.cache.get(channelId) as TextChannel;

      if (!channel) {
        continue;
      }

      const hasPermission = channel.guild.me
        ?.permissionsIn(channel)
        .has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS]);

      if (!hasPermission) {
        continue;
      }

      channel.send(sanitize(message));
    }
  }

  return null;
}

// Connect to discord, mongodb, and start the web server to listen for webhooks.
async function main(): Promise<void> {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.log("There was some error when setting up the slash commands. See below.");
    console.error(error);
  }

  try {
    await discordClient.login(TOKEN);
    console.log(`Logged in to Discord as ${discordClient?.user?.tag}!`);
  } catch (error) {
    console.log("There was some error when logging into Discord. See below.");
    console.dir(error);
  }

  try {
    await mongodbClient.connect();
    console.log("Logged in to MongoDB!");
  } catch (error) {
    console.log("There was some error when connecting to MongoDB. See below.");
    console.dir(error);
  }

  try {
    const server = Hapi.server({ port: PORT, host: "0.0.0.0" });

    server.route({
      method: "GET",
      path: "/",
      handler: () => "Hello there!",
    });

    server.route({
      method: "POST",
      path: "/",
      handler: handleRequest,
    });

    await server.start();
    console.log("Server running on port", PORT);
  } catch (error) {
    console.log("There was some error setting up the web server. See below.");
    console.dir(error);
  }
}

main();
