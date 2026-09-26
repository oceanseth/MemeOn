import { useCallback, useRef, useState, type RefCallback } from 'react'
import {
  appendMasonry,
  layoutMasonry,
  masonryGeometry,
  type MasonryLayout,
} from '../lib/masonry'

/** One absolutely-positioned card slot, in feed order. */
export interface MasonryGridSlot {
  key: string
  x: number
  y: number
  width: number
  height: number
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
 * The caller supplies items already deduped by id.
 */
export function useMasonryLayout(
  items: readonly { id: string; aspect: number }[],
  chromeHeight: number,
): MasonryGridModel {
  const [width, setWidth] = useState(0)
  const observerRef = useRef<ResizeObserver | null>(null)
  const containerRef = useCallback<RefCallback<HTMLElement>>((el) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0
      // whole pixels only: sub-pixel resize noise must not thrash the layout
      setWidth(Math.floor(next))
    })
    observer.observe(el)
    observerRef.current = observer
  }, [])

  // render-time cache, not state: identical inputs return the identical layout, and a longer
  // feed with the same geometry and id prefix appends instead of re-laying out
  const cacheRef = useRef<{ key: string; ids: readonly string[]; layout: MasonryLayout } | null>(
    null,
  )

  if (width <= 0) {
    return { containerRef, canvasWidth: 0, height: 0, slots: [] }
  }

  const geometry = masonryGeometry(width)
  const key = `${geometry.columns}:${geometry.columnWidth}:${geometry.gap}:${chromeHeight}`
  const ids = items.map((item) => item.id)
  const cached = cacheRef.current
  const appendable =
    cached !== null &&
    cached.key === key &&
    cached.ids.length <= ids.length &&
    cached.ids.every((id, index) => id === ids[index])
  const layout = appendable
    ? ids.length === cached.ids.length
      ? cached.layout
      : appendMasonry(
          cached.layout,
          items.slice(cached.ids.length).map((item) => item.aspect),
        )
    : layoutMasonry({
        aspects: items.map((item) => item.aspect),
        ...geometry,
        chromeHeight,
      })
  cacheRef.current = { key, ids, layout }

  return {
    containerRef,
    canvasWidth:
      geometry.columns * geometry.columnWidth + (geometry.columns - 1) * geometry.gap,
    height: layout.height,
    slots: layout.items.map((item, index) => ({
      key: ids[index] ?? String(index),
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    })),
  }
}
