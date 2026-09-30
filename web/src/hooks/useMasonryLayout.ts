import { useCallback, useRef, useState, type RefCallback } from 'react'
import {
  masonryGeometry,
  placeMasonryFeed,
  type MasonryFeedItem,
  type MasonryFeedPlacement,
} from '../lib/masonry'

/** One absolutely-positioned card slot, in feed order. */
export interface MasonryGridSlot {
  key: string
  x: number
  y: number
  width: number
  height: number
  /** the card's ratio is still being measured: the slot shows a skeleton, not the card */
  waiting: boolean
}

/** What `organisms/masonry-grid.tsx` renders: a measured canvas of fixed-position slots. */
export interface MasonryGridModel {
  /** attach to the full-width wrapper; a ResizeObserver keeps the layout at its width */
  containerRef: RefCallback<HTMLElement>
  /** the centred canvas the slots position against; 0 until the first measure */
  canvasWidth: number
  height: number
  slots: readonly MasonryGridSlot[]
}

/**
 * Masonry layout as an engine: feed-ordered `{ id, aspect }` items in, fixed slots out.
 * Append-only by construction — more items lay out against the existing column state and
 * placed slots never move; only a geometry change (column count / width) re-lays everything.
 * An item whose `aspect` is `null` is still being measured: it and everything after it wait as
 * skeletons, and are placed as the measurements land (`placeMasonryFeed`).
 * The caller supplies items already deduped by id.
 */
export function useMasonryLayout(
  items: readonly MasonryFeedItem[],
  chromeHeight: number,
): MasonryGridModel {
  const [width, setWidth] = useState(0)
  const observerRef = useRef<ResizeObserver | null>(null)
  const containerRef = useCallback<RefCallback<HTMLElement>>((el) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el) return
    // measured on attach, so the first layout lands in the commit that mounted the wrapper
    // instead of waiting on the observer's first callback
    setWidth(Math.floor(el.clientWidth))
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0
      // whole pixels only: sub-pixel resize noise must not thrash the layout
      setWidth(Math.floor(next))
    })
    observer.observe(el)
    observerRef.current = observer
  }, [])

  // render-time cache, not state: identical inputs return the identical layout, and a longer
  // placed run with the same geometry and id prefix appends instead of re-laying out
  const cacheRef = useRef<MasonryFeedPlacement | null>(null)

  if (width <= 0) {
    return { containerRef, canvasWidth: 0, height: 0, slots: [] }
  }

  const geometry = masonryGeometry(width)
  const feed = placeMasonryFeed(cacheRef.current, items, geometry, chromeHeight)
  cacheRef.current = feed.placement

  return {
    containerRef,
    canvasWidth:
      geometry.columns * geometry.columnWidth + (geometry.columns - 1) * geometry.gap,
    height: feed.layout.height,
    slots: feed.layout.items.map((item, index) => {
      const waiting = index >= feed.placed
      const id = items[index]?.id ?? String(index)
      return {
        key: waiting ? `waiting-${id}` : id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        waiting,
      }
    }),
  }
}
