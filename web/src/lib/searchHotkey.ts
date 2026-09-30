import type { RefCallback } from 'react'

/**
 * ⌘K (Ctrl+K off Apple hardware) drops focus into the page's search well. One document listener
 * for the module's life — the same imperative seam `lib/cardMedia.ts` keeps for the grid
 * observer — and the stable ref below tells it which well is mounted; a route carries at most
 * one. Not a store: nothing here is observable, and no React tree reads it.
 */

/** Whether this platform's command chord is ⌘ — picks the hint label and `aria-keyshortcuts`. */
export const prefersCommandKey =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

/** The mounted wells; a Set because a route change can mount the next before the last sweeps. */
const wells = new Set<HTMLElement>()

function releaseUnmountedWells(): void {
  for (const well of wells) {
    if (!well.isConnected) wells.delete(well)
  }
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.key !== 'k' && event.key !== 'K') || event.altKey || event.shiftKey) return
  if (!(event.metaKey || event.ctrlKey)) return
  releaseUnmountedWells()
  for (const well of wells) {
    const input = well.querySelector('input')
    if (!input) continue
    event.preventDefault()
    input.focus()
    input.select()
    return
  }
}

if (typeof window !== 'undefined') document.addEventListener('keydown', onKeydown)

/**
 * Stable for the life of the module, so React never re-runs it for a mere re-render.
 * React 18 calls this with null before removeChild, while `isConnected` is still true:
 * sweep on a microtask, after the commit detaches the node. Do not return a cleanup.
 */
export const searchHotkeySlotRef: RefCallback<HTMLElement> = (element) => {
  if (!element) {
    queueMicrotask(releaseUnmountedWells)
    return
  }
  releaseUnmountedWells()
  wells.add(element)
}
