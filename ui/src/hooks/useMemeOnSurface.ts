import { useNeedsRouter } from './useNeedsRouter'

/**
 * Mechanism for the MemeOn surface: whether a router still needs supplying.
 *
 * The canvas itself is styling policy and lives in the component — see
 * `MemeOnSurface`. This hook exists so a caller rendering its own surface can
 * reuse the router rule without inheriting the look.
 */
export function useMemeOnSurface() {
  return { needsRouter: useNeedsRouter() }
}
