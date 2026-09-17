import { sharedCopy } from './shared'

/** Every string the signed-in chrome shows. Keys name the role of the string, not its content. */
export const appShellCopy = {
  /** The top bar's five links. */
  nav: {
    marketplace: 'Marketplace',
    binder: 'My Binder',
    friends: 'Friends',
    trade: 'Trade',
    leaderboard: 'Top Brains',
    /** The link's glyph: an emoji that stays an emoji, ahead of the label. */
    leaderboardEmoji: '🏆',
  },
  /** The header's one primary, beside the braincell pill. */
  mint: 'Mint',
  /** Phone tab bar; 'Market' is the 62px abbreviation of Marketplace. */
  tabs: {
    market: 'Market',
    binder: 'Binder',
    mint: 'Mint',
    friends: 'Friends',
    trade: 'Trade',
  },
  /** The balance figure and the name it announces: a span takes no name from a title. */
  coins: {
    text: (coins: number) => `🧠 ${coins.toLocaleString()}`,
    label: (coins: number) => `${coins.toLocaleString()} braincells`,
  },
  /** The account menu behind the header avatar, at every width. */
  accountMenu: {
    trigger: 'Account menu',
    profile: 'Profile',
    leaderboard: '🏆 Top Brains',
    settings: 'Settings',
    developers: '🔧 Developers',
    discord: 'Discord',
    theme: 'Theme',
    logOut: sharedCopy.logOut,
  },
} as const
