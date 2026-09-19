import { braincells } from '../lib/braincells'
import { sharedCopy } from './shared'

const developers = 'Developers'
const discord = 'Discord'

/** Every string the signed-in chrome shows. Keys name the role of the string, not its content. */
export const appShellCopy = {
  /** Skip link: visible text and the accessible name stories query. */
  skip: 'Skip to content',
  brand: sharedCopy.brand,
  /** Top nav and the phone tab bar. */
  navAria: 'Main',
  footerAria: 'Footer',
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
    developers,
    discord,
    theme: 'Theme',
    logOut: sharedCopy.logOut,
  },
  /** Short footer labels — not the legal-page titles. */
  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
    developers,
    discord,
    api: 'API',
  },
} as const
