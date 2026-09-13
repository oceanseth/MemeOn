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
  /** Strings each trade card row spells for status, actions and finality. */
  card: {
    badge: {
      proposed: '⏳ proposed',
      accepted: '✅ accepted',
      declined: '❌ declined',
      cancelled: '🚫 cancelled',
    },
    statusLine: {
      proposed: 'Waiting',
      accepted: 'Deal complete',
      declined: 'Declined',
      cancelled: 'Withdrawn',
    },
    waiting: {
      onThem: 'Waiting on them',
      onYou: 'Waiting on you',
    },
    time: {
      justNow: 'just now',
      minutesAgo: (minutes: number) => `${minutes}m ago`,
      hoursAgo: (hours: number) => `${hours}h ago`,
      yesterday: 'yesterday',
      daysAgo: (days: number) => `${days}d ago`,
    },
    sharesOf: (shares: number) => `${shares} share${shares === 1 ? '' : 's'} of`,
    pendingMemeTitle: 'that meme',
    finality: {
      nothingLeaves:
        'Trades are final — nothing leaves your binder, but the cards you get are yours the moment you accept.',
      leaves: (list: string) => `Trades are final — ${list} leave your binder the moment you accept.`,
      and: (left: string, right: string) => `${left} and ${right}`,
    },
    sides: {
      give: 'You give',
      get: 'You get',
    },
    parties: {
      youOffered: (toName: string) => `You offered ${toName} a deal`,
      offeredYou: (fromName: string) => `${fromName} offered you a deal`,
      yourDeal: (name: string) => `Your deal with ${name}`,
    },
    actions: {
      withdraw: 'Withdraw',
      withdrawing: 'Withdrawing…',
      withdrawA11y: (toName: string) => `Withdraw your proposal to ${toName}`,
      decline: sharedCopy.decline,
      declining: 'Declining…',
      declineA11y: (fromName: string) => `Decline ${fromName}'s trade`,
      accept: sharedCopy.accept,
      accepting: 'Accepting…',
      acceptA11y: (fromName: string) => `Accept ${fromName}'s trade`,
    },
    sideSentence: {
      nothing: 'nothing',
    },
  },
} as const
