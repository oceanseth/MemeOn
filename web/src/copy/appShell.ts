import { braincells } from '../lib/braincells'
import { sharedCopy } from './shared'

/** Every string the signed-in chrome shows. Keys name the role of the string, not its content. */
export const appShellCopy = {
  brand: sharedCopy.brand,
  /** Bypass block: first Tab past the chrome onto `#main`. */
  skip: 'Skip to content',
  /** Landmark name for the top-bar links and the phone tab bar. */
  navAria: 'Main',
  footerAria: 'Footer',
  /** Short footer labels — not the legal-page titles. */
  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
    api: 'API',
  },
  /** The top bar's five links. */
  nav: {
    marketplace: 'Marketplace',
    binder: 'My Binder',
    friends: 'Friends',
    trade: 'Trade',
    leaderboard: 'Top Brains',
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
  braincells: {
    text: (amount: number) => braincells(amount),
    label: (amount: number) => `${braincells(amount)} braincells`,
  },
  /** The account menu behind the header avatar, at every width. */
  accountMenu: {
    trigger: 'Account menu',
    profile: 'Profile',
    leaderboard: 'Top Brains',
    settings: 'Settings',
    developers: 'Developers',
    discord: 'Discord',
    theme: 'Theme',
    logOut: sharedCopy.logOut,
  },
} as const
