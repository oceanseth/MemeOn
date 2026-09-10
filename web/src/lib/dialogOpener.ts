/**
 * Who opened a dialog, so focus can go back there when it closes.
 *
 * Base UI restores focus to a `Dialog.Trigger`, or else to whatever was focused when the popup
 * mounted. These dialogs have neither: they open from model state, and their popup is portalled
 * into an anchor that the closing commit removes. On a pointer dismissal the browser moves focus
 * to the nearest focusable ancestor of the removed node — the `<main>` landmark — before Base UI's
 * own restore runs, and Base UI then declines to move focus that has visibly gone elsewhere.
 * Recording the opener the moment a model turns open, and handing it back as `finalFocus`, makes
 * the restore explicit, so the scrim, Escape and a Cancel button all return the page where it
 * started.
 *
 * The record is module-scoped and keyed by dialog id because a model is a plain value rebuilt on
 * every render, and the molecule that renders it may not hold a ref.
 */

export interface DialogOpenerRef {
  /** null once the opener has left the page; Base UI then falls back to its own restore */
  readonly current: HTMLElement | null
}

const openers = new Map<string, DialogOpenerRef | null>()

/** The focused element, if it is one worth handing back to — never `<body>`, never SSR. */
function focusedElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const active = document.activeElement as HTMLElement | null
  if (!active || active === document.body) return null
  return typeof active.focus === 'function' ? active : null
}

function openerRef(opener: HTMLElement | null): DialogOpenerRef | null {
  if (!opener) return null
  return {
    // read at close time, so a dialog that outlived its opener asks for nothing
    get current(): HTMLElement | null {
      return opener.isConnected ? opener : null
    },
  }
}

/**
 * Records the opener on the first build that reports a dialog open, forgets it once it closes, and
 * returns the ref for `DialogFrame`'s `finalFocus` — `undefined` when nothing was focused worth
 * returning to, which leaves Base UI's own default in charge.
 */
export function trackDialogOpener(id: string, open: boolean): DialogOpenerRef | undefined {
  if (!open) {
    openers.delete(id)
    return undefined
  }
  if (!openers.has(id)) openers.set(id, openerRef(focusedElement()))
  return openers.get(id) ?? undefined
}
