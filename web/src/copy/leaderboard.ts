import { braincells } from '../lib/braincells'
import { plural, pluralWord } from '../lib/plural'
import { sharedCopy } from './shared'

/** Every string the Leaderboard (Top Brains) screen shows. Keys name the role, not the content. */
export const leaderboardCopy = {
  subtitle: 'Collect, trade, climb.',
  podium: {
    title: '🏆 Podium',
    subtitle: 'The wrinkliest braincell holders on MemeOn',
  },
  columns: {
    player: 'Ranked by braincell holdings',
    braincells: 'Braincells',
  },
  row: {
    /** gold, silver, bronze — positions past the podium get no medal */
    medals: ['🥇', '🥈', '🥉'],
    /** The whole row as one utterance, so the emoji columns can stay decorative. */
    label: (rank: number, name: string, count: number) => `Rank ${rank}, ${name}, ${plural(count, 'braincell')}`,
    /** the signed-in player's own row leads with "You", the rest of the label lower-cased */
    youLabel: (label: string) => `You, ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
    collection: (size: number) => `📚 ${size} ${pluralWord(size, 'meme')}`,
    portfolio: (value: number) => `portfolio ${braincells(value)}`,
    braincells: (count: number) => braincells(count),
    /** the pinned marker beside the reader's own name */
    you: 'you',
  },
  showMore: 'Show more brains',
  loading: 'Loading Top Brains…',
  empty: "Nobody's earned a braincell yet. The throne is empty.",
  loadError: "Couldn't load Top Brains.",
  retry: sharedCopy.tryAgain,
  listSummary: (count: number) => `${count} ${pluralWord(count, 'brain')} on the board`,
} as const
