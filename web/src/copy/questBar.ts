import { sharedCopy } from './shared'

/** Strings the quest rail and starter-pack dialog spell. */
export const questBarCopy = {
  status: {
    done: 'Done.',
    pending: 'Not done yet.',
  },
  rewardAria: (reward: number) => `rewards ${reward} braincells`,
  claim: {
    busy: 'Opening…',
    label: (title: string, reward: number) => `${title} (+${reward} 🧠)`,
  },
  dismiss: 'Later',
  dismissA11y: 'Later — hide quests for now',
  pack: {
    withMemes: (packReward: number) =>
      `You now hold 10 shares in each of these — plus ${packReward} 🧠 braincells.`,
    emptyVault: (packReward: number) =>
      `The vault was empty, so you got ${packReward} 🧠 braincells instead. Spend them wisely.`,
    close: sharedCopy.close,
  },
} as const
