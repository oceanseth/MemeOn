import { plural } from '../lib/plural'

/** Every string the Binder screen shows. Keys name the role of the string, not its content. */
export const binderCopy = {
  intro: 'Your corner of the internet. In card form.',
  /** The joiner between the parts of the status line and the card's announced name. */
  separator: ' · ',
  identity: {
    /** "6 cards · 72 shares" — counted from the memes the grid is rendering. */
    stats: (cards: number, shares: number) => `${plural(cards, 'card')} · ${plural(shares, 'share')}`,
  },
  /** One live status line for the whole screen. */
  status: {
    loading: 'Loading your binder…',
    /** The error box owns the error copy; the status line only reports that nothing loaded. */
    failed: 'No cards loaded',
    empty: 'No cards shown',
    shownOf: (visible: number, total: number) => `${visible} of ${plural(total, 'card')} shown`,
    shown: (visible: number) => `${plural(visible, 'card')} shown`,
    value: (value: number) => `🧠 ${value.toLocaleString()}`,
    privateIncluded: 'private included',
    /** How the active sort reads: plain words, never the chip's emoji. `[descending, ascending]`. */
    sort: {
      new: ['newest first', 'oldest first'],
      views: ['most views first', 'fewest views first'],
      reshares: ['most reshares first', 'fewest reshares first'],
      value: ['highest value first', 'lowest value first'],
    },
  },
  collection: {
    heading: 'Your collection',
    showPrivate: (count: number) => `Show private (${count})`,
    mint: 'Mint a meme',
    showMore: (count: number) => `Show ${count} more`,
  },
  card: {
    shares: (shares: number) => `${shares}/100 shares`,
    /** Parts of the card's announced name, after the title and tier. */
    minted: 'you minted this',
    private: 'private',
  },
  emptyState: {
    firstRun: 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.',
    allPrivate: (count: number) =>
      `All ${count} of your memes are private. Turn on "Show private" to see them.`,
    mintFirst: '＋ Mint your first meme',
  },
  errorState: {
    title: "Couldn't load your binder.",
    message: 'Your cards are safe — nothing was lost. Give it another go.',
  },
  /** Fallback when the fetch throws without a message; the error box shows the authored copy above. */
  machine: { unavailable: 'binder unavailable' },
} as const
