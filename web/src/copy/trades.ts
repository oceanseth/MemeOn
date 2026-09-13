import { braincells } from '../lib/braincells'
import { sharedCopy } from './shared'

/** Every string the Trades screen spells itself; the trade cards read `lib/tradeCardModel`. */
export const tradesCopy = {
  newTrade: 'Propose a trade',
  closeComposer: sharedCopy.close,
  loading: 'Loading trades…',
  /** "waiting" is already the state, not a countable noun — the number is the only plural */
  openCount: (count: number) => `${count} waiting`,
  /** an id that never resolves settles here, so a line stops shimmering and never shows a raw key */
  retiredMemeTitle: 'a retired meme',
  memeTierLabel: (name: string, rarity: string) => `${name} · ${rarity}`,
  composer: {
    binderOption: (title: string, held: number) => `${title} (you hold ${held})`,
    offerSharesHint: (held: number) => `you hold ${held}`,
    offerCoinsHint: (available: number) => `${braincells(available)} available`,
  },
  toasts: {
    executed: 'Trade executed 🤝',
  },
  errors: {
    load: "Couldn't load your trades. Try again.",
    respond: "Couldn't send your answer — this trade may already have been answered. Try again.",
    propose: "Couldn't send that proposal. Check the numbers and try again.",
    friends: "Couldn't load your friends list. Close this and open it again.",
  },
  confirm: {
    acceptTitle: 'Accept this trade?',
    withdrawTitle: 'Withdraw this proposal?',
    /** the accept restatement: `<strong>You give </strong>{ask}. <strong>You get </strong>{offer}.` */
    give: 'You give ',
    get: 'You get ',
    betweenSides: '. ',
    end: '.',
    withdraw: (offer: string, ask: string, toName: string) =>
      `You offered ${offer} for ${ask}. Withdrawing takes it off ${toName}'s table.`,
    acceptLabel: sharedCopy.accept,
    withdrawLabel: 'Withdraw',
  },
} as const
