import { sharedCopy } from './shared'

/** Strings the quest rail and starter-pack dialog spell. */
export const questBarCopy = {
  title: 'Earn your braincells',
  status: {
    done: 'Done.',
    pending: 'Not done yet.',
  },
  rewardAria: (reward: number) => `rewards ${reward} braincells`,
  claim: {
    busy: 'Opening…',
    label: (title: string, reward: number) => `${title} (+${reward} braincells)`,
  },
  /** The braincell pill's sr-only suffix while the ladder is live: "quests 1 of 5". */
  progress: (done: number, total: number) => `quests ${done} of ${total}`,
  dismiss: 'Later',
  dismissA11y: 'Later — hide quests for now',
  pack: {
    title: 'Starter pack opened!',
    viewInBinder: 'View in My Binder',
    explore: 'Keep exploring',
    claimError: "Pack didn't open — tap to try again.",
    withMemes: (packReward: number) =>
      `You now hold 10 shares in each of these — plus ${packReward} braincells.`,
    emptyVault: (packReward: number) =>
      `The vault was empty, so you got ${packReward} braincells instead. Spend them wisely.`,
    close: sharedCopy.close,
  },
} as const
