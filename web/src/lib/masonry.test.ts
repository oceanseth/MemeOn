import { describe, expect, it } from 'vitest'
import {
  appendMasonry,
  layoutMasonry,
  masonryCardHeight,
  masonryGeometry,
  MASONRY_COLUMN_WIDTH,
  MASONRY_SKELETON_ASPECTS,
  MEDIA_CHROME_X,
  MEDIA_CHROME_Y,
  placeMasonryFeed,
  type MasonryFeedItem,
} from './masonry'

/** Aspect whose card comes out exactly `h` tall at `columnWidth` with zero chrome rows. */
const aspectForHeight = (h: number, columnWidth: number): number =>
  (columnWidth - MEDIA_CHROME_X) / (h - MEDIA_CHROME_Y)

const COL_W = 150

describe('masonryGeometry', () => {
  it('fits fixed 248px columns with 16px gaps, floor 2, from 640px up', () => {
    // 4 × 248 + 3 × 16 = 1040
    expect(masonryGeometry(1040)).toEqual({ columns: 4, columnWidth: 248, gap: 16 })
    expect(masonryGeometry(1039).columns).toBe(3)
    expect(masonryGeometry(1440).columns).toBe(5)
    // narrow desktop never drops below two columns
    expect(masonryGeometry(640)).toEqual({ columns: 2, columnWidth: 248, gap: 16 })
  })

  it('goes two fluid columns with a 12px gap below 640', () => {
    expect(masonryGeometry(390)).toEqual({ columns: 2, columnWidth: (390 - 12) / 2, gap: 12 })
  })
})

describe('masonryCardHeight', () => {
  it('is window height plus frame chrome plus the grid chrome rows', () => {
    // a square window at 248: (248 − 37) / 1 = 211 art + 28 frame + 82 meta
    expect(masonryCardHeight(1, MASONRY_COLUMN_WIDTH, 82)).toBe(211 + 28 + 82)
  })
})

describe('layoutMasonry', () => {
  it('chooses the shortest column by content height, ignoring gaps', () => {
    // col0 gets two 50s (content 100, but 116 with its gap); col1 one 105.
    // Giphy's rule compares 100 < 105 and picks col0; counting gaps would pick col1.
    const aspects = [50, 105, 50, 60].map((h) => aspectForHeight(h, COL_W))
    const layout = layoutMasonry({
      aspects,
      columns: 2,
      columnWidth: COL_W,
      gap: 16,
      chromeHeight: 0,
    })
    expect(layout.items.map((i) => i.column)).toEqual([0, 1, 0, 0])
  })

  it('breaks ties to the leftmost column and positions with gaps', () => {
    const aspects = [40, 40, 40].map((h) => aspectForHeight(h, COL_W))
    const layout = layoutMasonry({
      aspects,
      columns: 3,
      columnWidth: COL_W,
      gap: 10,
      chromeHeight: 0,
    })
    expect(layout.items.map((i) => i.column)).toEqual([0, 1, 2])
    expect(layout.items.map((i) => i.x)).toEqual([0, 160, 320])
    // fourth item: all columns at 40 → leftmost again, below the gap
    const more = appendMasonry(layout, [aspectForHeight(30, COL_W)])
    expect(more.items[3]).toMatchObject({ column: 0, x: 0, y: 50 })
    expect(more.height).toBe(80) // col0 bottom: 40 + 10 + 30
  })

  it('append never moves an already-placed item', () => {
    const first = layoutMasonry({
      aspects: [60, 45, 80, 52].map((h) => aspectForHeight(h, COL_W)),
      columns: 2,
      columnWidth: COL_W,
      gap: 16,
      chromeHeight: 0,
    })
    const second = appendMasonry(
      first,
      [70, 41, 66].map((h) => aspectForHeight(h, COL_W)),
    )
    expect(second.items.slice(0, first.items.length)).toEqual(first.items)
    expect(second.items).toHaveLength(7)
  })

  it('lays a 2-column mobile feed with fluid widths', () => {
    const { columns, columnWidth, gap } = masonryGeometry(390)
    const layout = layoutMasonry({
      aspects: [1, 0.75],
      columns,
      columnWidth,
      gap,
      chromeHeight: 56,
    })
    expect(layout.items[0]).toMatchObject({ column: 0, x: 0, y: 0, width: 189 })
    expect(layout.items[1]).toMatchObject({ column: 1, x: 201, y: 0, width: 189 })
    expect(layout.height).toBe(Math.max(layout.items[0]!.height, layout.items[1]!.height))
  })

  it('container height is the deepest column bottom including its gaps', () => {
    const layout = layoutMasonry({
      aspects: [50, 50, 50].map((h) => aspectForHeight(h, COL_W)),
      columns: 2,
      columnWidth: COL_W,
      gap: 16,
      chromeHeight: 0,
    })
    // col0: 50 + 16 + 50 = 116; col1: 50
    expect(layout.height).toBe(116)
  })
})

describe('placeMasonryFeed (the placement gate)', () => {
  const geometry = { columns: 3, columnWidth: COL_W, gap: 10 }
  const feed = (...aspects: (number | null)[]): MasonryFeedItem[] =>
    aspects.map((aspect, index) => ({ id: `m${index}`, aspect }))

  it('places the longest prefix whose ratios are known and lays the rest out as skeletons', () => {
    const placed = placeMasonryFeed(null, feed(1, 0.5, null, 2, 1), geometry, 0)
    expect(placed.placed).toBe(2)
    expect(placed.placement.ids).toEqual(['m0', 'm1'])
    // m3 is known but sits behind m2: placing it now would move it when m2 lands
    expect(placed.placement.layout.items).toHaveLength(2)
    expect(placed.layout.items).toHaveLength(5)
    // the skeleton tail is sized by feed index, after the placed run
    const tail = layoutMasonry({
      aspects: [1, 0.5, ...[2, 3, 4].map((i) => MASONRY_SKELETON_ASPECTS[i % 4] as number)],
      ...geometry,
      chromeHeight: 0,
    })
    expect(placed.layout.items).toEqual(tail.items)
  })

  it('a late measurement extends the run by appending, never moving a placed card', () => {
    const first = placeMasonryFeed(null, feed(1, 0.5, null, 2, 1), geometry, 0)
    const later = placeMasonryFeed(first.placement, feed(1, 0.5, 1.5, 2, 1), geometry, 0)
    expect(later.placed).toBe(5)
    expect(later.layout.items.slice(0, 2)).toEqual(first.placement.layout.items)
    // and it is the same layout the whole feed gets when laid out in one go
    expect(later.layout).toEqual(
      layoutMasonry({ aspects: [1, 0.5, 1.5, 2, 1], ...geometry, chromeHeight: 0 }),
    )
    // an unchanged feed returns the kept layout itself
    expect(placeMasonryFeed(later.placement, feed(1, 0.5, 1.5, 2, 1), geometry, 0).layout).toBe(
      later.placement.layout,
    )
  })

  it('a timed-out measurement resolves as a square and releases the rest of the feed', () => {
    const waiting = placeMasonryFeed(null, feed(null, 0.5, 2), geometry, 0)
    expect(waiting.placed).toBe(0)
    expect(waiting.layout.items).toHaveLength(3)
    // the budget ran out on m0: `memeFrameAspect('failed')` is 1
    const released = placeMasonryFeed(waiting.placement, feed(1, 0.5, 2), geometry, 0)
    expect(released.placed).toBe(3)
    expect(released.layout.items[0]?.height).toBe(masonryCardHeight(1, COL_W, 0))
  })

  it('re-lays everything when the geometry changes, and nothing when it does not', () => {
    const first = placeMasonryFeed(null, feed(1, 0.5, 2), geometry, 0)
    const wider = placeMasonryFeed(first.placement, feed(1, 0.5, 2), { ...geometry, columns: 2 }, 0)
    expect(wider.layout).toEqual(
      layoutMasonry({ aspects: [1, 0.5, 2], ...geometry, columns: 2, chromeHeight: 0 }),
    )
    // a different feed (a new sort) is not a prefix: laid out from scratch
    const resorted = placeMasonryFeed(first.placement, feed(2, 0.5, 1).reverse(), geometry, 0)
    expect(resorted.placement.ids).toEqual(['m2', 'm1', 'm0'])
    expect(resorted.layout.items[0]?.column).toBe(0)
  })
})
