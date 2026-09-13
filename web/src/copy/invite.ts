import { pluralWord } from '../lib/plural'
import { sharedCopy } from './shared'

/** Every string the Invite screen spells itself; the highlight cards read `lib/memeCardModel`. */
export const inviteCopy = {
  loading: 'Loading invite…',
  /** the sentence under the hero: one line, product language, never "invest" */
  body: 'Mint memes, share the link, and trade your friends’ bangers before they go ✨Shiny✨.',
  /** closing line under the highlight cards */
  climbNote: 'Every share makes the card climb.',
  /** stands in for the inviter's name while the invite has not loaded */
  fallbackInviterName: 'your pal',
  /** the busy label keeps the ready label's emoji, so the glyph never blinks out mid-press */
  openingMasky: '🎭 Opening Masky…',
  stats: {
    binder: { emoji: '📚', label: 'in binder' },
    braincells: { emoji: '🧠', label: (count: number) => pluralWord(count, 'braincell') },
    followers: { emoji: '⭐', label: (count: number) => pluralWord(count, 'follower') },
  },
  highlightsTitle: (name: string) => `${name}'s binder highlights`,
  acceptanceNote: {
    self: "Send this link to a friend — they'll join with Masky and you'll be friends instantly.",
    guest: (name: string) =>
      `Sign in with your Masky avatar. You start with a free starter pack and ${name} as your first friend.`,
  },
  accept: {
    befriend: (name: string) => `🤝 Accept & befriend ${name}`,
    adding: (name: string) => `🤝 Adding ${name}…`,
    join: (name: string) => `🎭 Join ${name} on MemeOn`,
    /** the guest label before the inviter has loaded: "Join MemeOn on MemeOn" */
    joinFallbackName: sharedCopy.brand,
    success: (name: string) => `You and ${name} are now friends 🤝`,
  },
  /** the dead-link branch is a screen, not a cul-de-sac: it always offers a way in */
  fatal: {
    title: 'This invite link expired',
    join: '🎭 Join MemeOn anyway',
    home: sharedCopy.backToBrand,
  },
  /** the owner of the link gets something to do with it instead of an instruction */
  self: {
    note: 'This is your own invite link — send it to a friend!',
    copy: '🔗 Copy invite link',
    copied: '✅ Link copied',
    copyFailed: '⚠️ Copy failed — try again',
    copiedStatus: 'Invite link copied to your clipboard.',
    copyFailedStatus: 'Could not copy the link. Try again.',
    friends: 'See your friends',
  },
  errors: {
    load: 'This invite link is invalid or expired.',
    accept: "Couldn't accept this invite — try again.",
    /** shown only when the failure carries no message of its own */
    acceptFallback: 'accept request failed',
    masky: 'Could not reach Masky — try again.',
  },
} as const
