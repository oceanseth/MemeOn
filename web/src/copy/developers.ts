import { appShellCopy } from './appShell'
import { sharedCopy } from './shared'

/** Every string the Developers (API keys) screen shows. Keys name the role of the string, not its content. */
export const developersCopy = {
  pageTitle: appShellCopy.accountMenu.developers,
  skillButton: 'API skill.md',
  /** Visible placeholder; `labelInput` is the field's accessible name. */
  labelPlaceholder: 'Key label (e.g. my-trading-bot)',
  retry: sharedCopy.tryAgain,
  /** Text nodes of the security explainer; the screen glues `<strong>` / `<InlineLink>` / `<code>`. */
  explainer: {
    lede: 'API keys act as ',
    account: 'your account',
    powers:
      ': they can mint memes, gift shares (including to users your own site knows only by Masky avatar id), trade, and read everything you can. Full endpoint reference lives in ',
    skill: 'skill.md',
    alsoAt: ' (also at ',
    wellKnown: '/.well-known/skill.md',
    close: ' for agents). Treat keys like passwords.',
  },
  /** The label a key gets when the field is left blank; it comes back from the API as the key's name. */
  defaultLabel: 'my key',
  labelInput: 'API key label',
  keysHeading: 'Your keys',
  /** Quota caption beside the heading, not a badge. */
  quota: (count: number, limit: number) => `${count} of ${limit} keys`,
  quotaNote: 'Key limit reached — revoke one to make room.',
  createKey: 'Create key',
  creating: 'Creating…',
  loading: 'Loading your API keys…',
  emptyState: {
    message: 'No keys yet — name one above and hit Create key.',
    hint: 'You’ll see the full key exactly once, so paste it straight into your bot.',
  },
  freshKey: {
    heading: 'Copy it now — shown once:',
    copy: 'Copy key',
    /** Copy outcome beside the button, not inside its label; the screen draws the `circle-check`. */
    copied: 'Copied',
  },
  row: {
    created: (date: string) => `created ${date}`,
    revoke: (label: string) => `Revoke API key ${label}`,
    revokeLabel: 'Revoke',
  },
  revokeDialog: {
    title: 'Revoke this API key?',
    /** The key's prefix, as a code span, then the sentence that names it. */
    prefix: (prefix: string) => `${prefix}…`,
    body: (label: string) => ` (${label}). This disconnects every app using it.`,
    confirm: 'Revoke it',
  },
  success: {
    revoke: (label: string) => `Revoked ${label}.`,
  },
  errors: {
    create: 'Couldn’t create that key. Try again.',
    copy: 'Couldn’t copy — select the key and copy it manually.',
    revoke: (label: string) => `Couldn’t revoke ${label} — try again.`,
    /** A failed fetch is an unknown list, never an empty account. */
    load: 'Couldn’t reach the key list — your keys are still active.',
  },
} as const
