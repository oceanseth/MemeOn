/**
 * Labels that recur across surfaces. A surface module (`copy/settings.ts`, …) references these
 * rather than respelling them, so "Log out" reads the same everywhere.
 *
 * Plain data only: `copy/` imports nothing but `copy/` and the two formatting helpers
 * (`lib/plural`, `lib/braincells`). It is read by hooks, `lib/*Model.ts` builders, tests and
 * stories. Tier components never import it — strings reach them as props.
 */
export const sharedCopy = {
  brand: 'MemeOn',
  logOut: 'Log out',
  tryAgain: 'Try again',
  retry: 'Retry',
  close: 'Close',
  cancel: 'Cancel',
  accept: 'Accept',
  decline: 'Decline',
  loading: 'Loading…',
  /** Auth wait and lazy-chunk Suspense share this labelled spinner — do not reuse `loading`. */
  checkingSession: 'Checking your session…',
  copied: 'Copied ✓',
  browseMarketplace: 'Browse the marketplace',
  backToBrand: 'Back to MemeOn',
  checkConnection: 'Check your connection and try again.',
  masky: {
    logIn: 'Log in with Masky',
    logInButton: 'Log in with Masky',
    redirecting: 'Redirecting…',
    redirectingTo: 'Redirecting to Masky',
  },
  /** Auto · Light · Dark — Settings, the public header button, and the account-menu radio. */
  theme: {
    group: 'Theme',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    cycle: (current: string, next: string) => `Theme: ${current}. Switch to ${next}`,
  },
} as const
