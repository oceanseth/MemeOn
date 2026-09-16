/**
 * A ref-shaped `container` for a Base UI `Portal`. Base UI reads `.current` in a layout effect,
 * after the anchor `<span>` is in the DOM, so a getter over `getElementById` needs no ref and no
 * hook — a molecule may call it inline. Pair it with the `PortalAnchor` atom of the same id so an
 * overlay stays inside the screen it belongs to and a story's `within(canvasElement)` finds it.
 */
export interface PortalAnchorRef {
  readonly current: HTMLElement | null
}

export function portalAnchor(id: string): PortalAnchorRef {
  return {
    get current(): HTMLElement | null {
      return typeof document === 'undefined' ? null : document.getElementById(id)
    },
  }
}
