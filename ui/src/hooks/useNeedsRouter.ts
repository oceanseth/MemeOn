import { useInRouterContext } from 'react-router-dom'

/**
 * Whether this subtree still needs a Router supplied.
 *
 * Components that render `<Link>` throw without a Router ancestor, and React
 * unmounts the subtree — the UI blanks with no visible error. Callers supply a
 * `MemoryRouter` only when this is true, so a real host router keeps owning
 * navigation.
 */
export function useNeedsRouter(): boolean {
  return !useInRouterContext()
}
