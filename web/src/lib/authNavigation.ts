/* The two navigations that leave the SPA for another origin. */

/** Bounce to Masky's authorize page. */
export function navigateToAuthorization(url: string): void {
  window.location.assign(url)
}

/** Hand an OAuth result to the native app (`memeon://auth?…`); replaces so Back skips the forward. */
export function forwardToDeepLink(url: string): void {
  window.location.replace(url)
}
