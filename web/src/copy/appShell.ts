import { sharedCopy } from './shared'

/** Settings is named three times in the chrome (utility link, identity gear, account menu): one spelling. */
const settings = 'Settings'

/** Every string the signed-in chrome shows. Keys name the role of the string, not its content. */
export const appShellCopy = {
  /** Header tagline on signed-in routes. */
  tagline: 'the meme trading card market',
  /** Sidebar rows. */
  nav: {
    marketplace: 'Marketplace',
    binder: 'My Binder',
    friends: 'Friends',
    trade: 'Trade',
    leaderboard: 'Top Brains',
    /** The row's glyph: an emoji that stays an emoji, in the icon lane. */
    leaderboardEmoji: '🏆',
  },
  /** Sidebar utility links, under the theme control. */
  utility: {
    discord: 'Discord',
    developers: 'Developers',
    developersEmoji: '🔧',
    settings,
  },
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
  avatar: {
    profile: 'Your profile',
  },
  identity: {
    settings,
  },
  /** The phone header's account menu. */
  accountMenu: {
    trigger: 'Account menu',
    profile: 'Profile',
    leaderboard: '🏆 Top Brains',
    settings,
    developers: '🔧 Developers',
    logOut: sharedCopy.logOut,
  },
  logOut: sharedCopy.logOut,
} as const
