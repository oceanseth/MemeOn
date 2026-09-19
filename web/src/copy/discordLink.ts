import { sharedCopy } from './shared'

const connectDiscord = 'Connect Discord' as const

/** Every string the Discord link ritual spells itself. */
export const discordLinkCopy = {
  heading: 'Connect Discord to MemeOn',
  /** Tab title; `heading` stays the longer on-screen H1. */
  documentTitle: connectDiscord,
  connect: connectDiscord,
  notNow: 'Not now',
  nextSteps: 'What happens next',
  command: '/memeon',
  privacyLede: {
    before: 'Your Discord name is never shown to other MemeOn users — ',
    after: " just ranks your own binder and your friends' memes first.",
  },
  doneBody: {
    before: 'Head back to Discord — ',
    after: " now ranks your binder and friends' memes first.",
  },
  tryAgain: sharedCopy.tryAgain,
  backToBrand: sharedCopy.backToBrand,
  done: 'Connected!',
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
