/**
 * Labels that recur across surfaces. A surface module (`copy/settings.ts`, …) spreads or
 * references these rather than respelling them, so "Log out" reads the same everywhere.
 *
 * Plain data only: `copy/` imports nothing and is read by hooks, `lib/*Model.ts` builders,
 * tests and stories. Tier components never import it — strings reach them as props.
 */
export const sharedCopy = {
  brand: 'MemeOn',
  logOut: 'Log out',
} as const
