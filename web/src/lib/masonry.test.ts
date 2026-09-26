import { describe, expect, it } from 'vitest'
import {
  appendMasonry,
  layoutMasonry,
  masonryCardHeight,
  masonryGeometry,
  MASONRY_COLUMN_WIDTH,
  MEDIA_CHROME_X,
  MEDIA_CHROME_Y,
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
    // a square window at 248: (248 − 50) / 1 = 198 art + 38 frame + 56 meta
    expect(masonryCardHeight(1, MASONRY_COLUMN_WIDTH, 56)).toBe(198 + 38 + 56)
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
