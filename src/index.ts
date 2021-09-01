import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Client, Intents } from "discord.js";
import { MongoClient } from "mongodb";
import Hapi from "@hapi/hapi";

const { DB_URL, DB_NAME, TOKEN, PORT = 8080 } = process.env;

if (!DB_URL) process.exit(600);
if (!DB_NAME) process.exit(601);
if (!TOKEN) process.exit(602);

const dbClient = new MongoClient(DB_URL);
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const commands = [
  {
    name: "dbg-add",
    description: "Add a subscription for the current channel",
    options: [
      {
        name: "organisation",
        description: "The GitHub Organisation or User",
        type: 3,
        required: true,
      },
      {
        name: "repo",
        description: "The repository name",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "dbg-remove",
    description: "Remove a subscription from the current channel",
    options: [
      {
        name: "organisation",
        description: "The GitHub Organisation or User",
        type: 3,
        required: true,
      },
      {
        name: "repo",
        description: "The repository name",
        type: 3,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "9" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands("223737808697688064"), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("ready", () => {
  console.log(`Logged in to Discord as ${client?.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  console.log(
    interaction.channelId,
    interaction.options.getString("organisation"),
    interaction.options.getString("repo")
  );
});

async function main(): Promise<void> {
  try {
    // Login to discord
    await client.login(TOKEN);

    // Connect to mongodb
    await dbClient.connect();

    const db = dbClient.db(DB_NAME);
    console.log("Logged in to MongoDB!");

    // Set up server, wait for webhooks
    const server = Hapi.server({ port: PORT, host: "localhost" });
    server.route({
      method: "GET",
      path: "/",
      handler: (request: any, h: any) => {
        return "Hello there!";
      },
    });

    // server.route({
    //   method: "POST",
    //   path: "/",
    //   handler: (request: any, h: any) => {
    //     console.log(request, h);
    //     return null;
    //   },
    // });

    await server.start();
    console.log("Server running on port", PORT);
  } catch (error) {
    console.error(error);
  }
}

process.on("unhandledRejection", (error) => {
  console.error(error);
  process.exit(1);
});

main();
