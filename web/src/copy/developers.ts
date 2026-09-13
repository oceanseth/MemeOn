/** Every string the Developers (API keys) screen shows. Keys name the role of the string, not its content. */
export const developersCopy = {
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
    /** Copy outcome beside the button, not inside its label. */
    copied: '✓ Copied',
  },
  row: {
    created: (date: string) => `created ${date}`,
    revoke: (label: string) => `Revoke API key ${label}`,
  },
  revokeDialog: {
    title: 'Revoke this API key?',
    /** The key's prefix, as a code span, then the sentence that names it. */
    prefix: (prefix: string) => `${prefix}…`,
    body: (label: string) => ` (${label}). This disconnects every app using it.`,
    confirm: 'Revoke it',
  },
  errors: {
    create: 'Couldn’t create that key. Try again.',
    copy: 'Couldn’t copy — select the key and copy it manually.',
    revoke: (label: string) => `Couldn’t revoke ${label} — try again.`,
    /** A failed fetch is an unknown list, never an empty account. */
    load: 'Couldn’t reach the key list — your keys are still active.',
  },
} as const
