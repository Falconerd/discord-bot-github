import avatar from './avatar';

export default {
  interval: 5000,
  google: {
    key: 'your-google-api-key'
  },
  github: {
    token: 'your-github-token'
  },
  discord: {
    email: 'yourdiscordbot@yoursite.com',
    password: 'yourdiscordbotpassword',
    avatar
  },
  subscriptions: [
    {
      server_id: 'your-discord-server-id',
      channel_name: 'github',
      invite: 'your-discord-invite-url',
      repositories: [
        {
          user: 'Falconerd',
          name: 'multiply',
          events: {
            Push: true,
            CommitComment: true,
            PullRequest: true,
            Issues: true,
            IssueComment: true,
            Create: true,
            Delete: true
          }
        }
      ]
    }
  ]
}
