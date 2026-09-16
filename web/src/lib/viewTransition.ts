/**
 * Run a DOM update inside a same-document View Transition where the browser offers one and the
 * reader has not asked for reduced motion; otherwise run it plainly. The update runs synchronously
 * in both arms, so a caller can `flushSync` a router navigation into it and the old frame is
 * captured before the route swaps. The chrome names the parts that hold still and the part that
 * glides (`organisms/app-shell.css`); everything else cross-fades.
 */
export function withViewTransition(update: () => void): void {
  const doc: (Document & { startViewTransition?: (cb: () => void) => unknown }) | null =
    typeof document === 'undefined' ? null : document
  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc || typeof doc.startViewTransition !== 'function' || reduce) {
    update()
    return
  }
  doc.startViewTransition(update)
}
