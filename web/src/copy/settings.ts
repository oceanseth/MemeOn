import { sharedCopy } from './shared'

/** Every string the Settings screen shows. Keys name the role of the string, not its content. */
export const settingsCopy = {
  title: 'Settings',
  intro: 'Make yourself at home.',
  account: {
    heading: 'Account',
    /**
     * The display name, unadorned — no leading mark. It keeps its function shape because the label
     * is the seam a future "Signed in as …" would be spelled at, not because anything prefixes it.
     */
    name: (name: string) => `${name}`,
    provider: 'Masky avatar',
    logOut: sharedCopy.logOut,
  },
  appearance: {
    heading: 'Appearance',
    caption: 'Auto follows your device.',
  },
  connections: {
    heading: 'Connections',
    discord: {
      service: 'Discord',
      notLinked: 'Not linked',
      connect: 'Connect Discord',
      /** The linked row, the day `Me` reports one; today only the story reaches it. */
      linkedAs: (handle: string) => `Linked as ${handle}`,
      open: 'Open Discord page',
    },
  },
} as const
