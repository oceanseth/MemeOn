import { appShellCopy as copy } from '../copy/appShell'

/**
 * Skip link, wordmark, nav landmarks, and the site footer — the chrome both the
 * public and signed-in shells share. `AppShell` is props-only; this bag is how
 * strings reach it. Routes stay on the organism (`/privacy`, `/skill.md`).
 */
export interface AppShellChromeModel {
  skipLabel: string
  brand: string
  navAria: string
  footerAria: string
  footer: {
    privacy: string
    terms: string
    developers: string
    discord: string
    api: string
  }
}

export function buildAppShellChrome(): AppShellChromeModel {
  return {
    skipLabel: copy.skip,
    brand: copy.brand,
    navAria: copy.navAria,
    footerAria: copy.footerAria,
    footer: {
      privacy: copy.footer.privacy,
      terms: copy.footer.terms,
      developers: copy.accountMenu.developers,
      discord: copy.accountMenu.discord,
      api: copy.footer.api,
    },
  }
}
