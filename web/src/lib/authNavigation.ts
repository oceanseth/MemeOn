/* The two navigations that leave the SPA for another origin. Storybook aliases this module to
   `.storybook/mocks/authNavigation.ts`, which records the URL instead of moving the iframe. */

/** Bounce to Masky's authorize page. */
export function navigateToAuthorization(url: string): void {
  window.location.assign(url)
}

/** Hand an OAuth result to the native app (`memeon://auth?…`); replaces so Back skips the forward. */
export function forwardToDeepLink(url: string): void {
  window.location.replace(url)
}
