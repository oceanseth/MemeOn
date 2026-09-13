/** Every string the Discord link ritual spells itself. */
export const discordLinkCopy = {
  heading: 'Connect Discord to MemeOn',
  done: '🎮 Connected!',
  /** keyed by the busy phases of `discordLinkMachine` */
  busy: {
    checking: 'Checking your link…',
    redirecting: 'Taking you to Masky to log in…',
    working: 'Connecting your Discord…',
  },
  error: {
    title: "Couldn't connect Discord",
    /** keyed by `DiscordLinkFailure` */
    body: {
      'missing-token': 'This link is missing its code. Run /memeon-connect in Discord for a fresh one.',
      expired: 'This link already got used or expired. Fresh links last 10 minutes.',
      login: 'The Masky login never came back. Run /memeon-connect in Discord for a fresh link.',
      unreachable: "MemeOn couldn't reach the linker. Try again in a moment.",
    },
  },
} as const
