import { sharedCopy } from './shared'

/** Every string the Landing screen's engine supplies. Keys name the role of the string, not its content. */
export const landingCopy = {
  /** Meme titles lettered on the three tilted cards of the hero pile, by tier. */
  heroCaptions: {
    gold: 'one braincell left',
    silver: 'this one',
    prismatic: 'nothing here',
  },
  tier: {
    /** Ladder card middle line: "0 reshares" … "25,000 reshares". */
    reshares: (count: number) => `${count.toLocaleString()} reshares`,
  },
  login: {
    label: sharedCopy.masky.logInButton,
    /** The button's accessible name; the visible label carries the mask. */
    name: sharedCopy.masky.logIn,
    busyLabel: sharedCopy.masky.redirecting,
    busyName: sharedCopy.masky.redirectingTo,
  },
  /** The closing card: the page finishes convincing there, so the CTA repeats under it. */
  closing: {
    lineLoggedIn: 'Your binder is waiting.',
    lineLoggedOut: 'Your next group-chat classic is a card already.',
    label: '🎭 Grab your pack with Masky',
    name: 'Grab your pack with Masky',
    busyLabel: sharedCopy.masky.redirecting,
    busyName: 'Redirecting to Masky for your pack',
  },
  errors: {
    /** Thrown strings never reach the page: one authored sentence that names the recovery. */
    login: "Masky didn't answer. Tap Log in with Masky to try again.",
  },
  /** Machine fallback when Masky login throws without a message. */
  machine: { loginFailed: 'login failed' },
} as const
