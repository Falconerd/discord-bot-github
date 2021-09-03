import { Collection } from "mongodb";

type Record = {
  repo: string;
  channelId: string;
  secret?: string;
  flags?: number;
};

export async function add(
  repo: string,
  channelId: string,
  subscriptions: Collection,
  secret?: string | null,
  previews?: boolean | null
): Promise<boolean> {
  const exists = await subscriptions.findOne({ repo, channelId });

  if (exists) {
    return false;
  }

  const record: Record = { repo, channelId };

  if (secret) {
    record.secret = secret;
  }

  if (previews) {
    record.flags = 1;
  }

  await subscriptions.insertOne(record);

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
      {
        name: "previews",
        description: "Display link previews",
        type: 5,
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
