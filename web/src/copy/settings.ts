import { sharedCopy } from './shared'

/** Every string the Settings screen shows. Keys name the role of the string, not its content. */
export const settingsCopy = {
  title: 'Settings',
  intro: 'Make yourself at home.',
  account: {
    heading: 'Account',
    /** Brain mark is part of the name label, not a separate icon. */
    name: (name: string) => `🧠 ${name}`,
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
      /** Emoji stays emoji. */
      service: '🎭 Discord',
      notLinked: 'Not linked',
      connect: 'Connect Discord',
      /** The linked row, the day `Me` reports one; today only the story reaches it. */
      linkedAs: (handle: string) => `Linked as ${handle}`,
      open: 'Open Discord page',
    },
  },
  alerts: {
    heading: 'Alerts',
    caption: 'Coming soon — for now every alert lands in 🔔.',
    sales: 'Sales',
    tierUps: 'Tier-ups',
  },
} as const
