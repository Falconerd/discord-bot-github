import { Collection } from "mongodb";

export async function add(
  repo: string,
  channelId: string,
  subscriptions: Collection,
  secret?: string | null
): Promise<boolean> {
  const exists = await subscriptions.findOne({ repo, channelId });

  if (exists) {
    return false;
  }

  if (secret) {
    await subscriptions.insertOne({ repo, channelId, secret });
  } else {
    await subscriptions.insertOne({ repo, channelId });
  }
  return true;
}

export async function remove(repo: string, channelId: string, subscriptions: Collection): Promise<void> {
  await subscriptions.deleteOne({ repo, channelId });
}

export const commands = [
  {
    name: "dbg-add",
    description: "Add a subscription for the current channel",
    options: [
      {
        name: "org",
        description: "The GitHub Organisation or User",
        type: 3,
        required: true,
      },
      {
        name: "name",
        description: "The repository name",
        type: 3,
        required: true,
      },
      {
        name: "secret",
        description: "Webhook secret (this will be stored as plain text)",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "dbg-remove",
    description: "Remove a subscription from the current channel",
    options: [
      {
        name: "org",
        description: "The GitHub Organisation or User",
        type: 3,
        required: true,
      },
      {
        name: "name",
        description: "The repository name",
        type: 3,
        required: true,
      },
    ],
  },
];
