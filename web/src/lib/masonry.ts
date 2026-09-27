/**
 * Pure masonry arithmetic. Cards are placed in feed order into the column whose *content*
 * height (sum of card heights, gaps excluded) is shortest — Giphy's placement rule, verified
 * against giphy.com 2026-09-26; counting gaps mis-places items in mixed-height feeds. Gaps
 * re-enter only when computing a card's `y`. Placement is append-only: laying out more items
 * never moves the ones already placed; only a column-count change re-lays out everything.
 */

/** Grid geometry (decision: fixed 248px columns, 16px gaps, centred; <640px two fluid columns). */
export const MASONRY_COLUMN_WIDTH = 248
export const MASONRY_GAP = 16
export const MASONRY_NARROW_GAP = 12
/** below this container width the grid is two fluid columns */
export const MASONRY_NARROW_WIDTH = 640

/**
 * The collectible frame's fixed chrome between the card's outer edge and the art window's
 * content box (`atoms/foil.css`): horizontally 4+16 `foil-media` padding + 2×(1 border + 12
 * padding) rail + 2×2 window border = 50; vertically 4+4 padding + 26 rail + 4 border = 38.
 * The window content box carries the meme's clamped aspect, so a card's height is arithmetic.
 */
export const MEDIA_CHROME_X = 50
export const MEDIA_CHROME_Y = 38

/**
 * The card's fixed meta rows under the art window (`molecules/meme-card.tsx`, size default):
 * 12 top padding + 24 one-line title + 4 gap + 16 kicker row. Screens with a card footer add
 * their own constant on top when they pass `chromeHeight`.
 */
export const MEME_CARD_META_HEIGHT = 56

/** Deterministic aspect mix for loading placeholders, cycled to the skeleton count. */
export const MASONRY_SKELETON_ASPECTS = [1, 0.75, 1.33, 0.56] as const

/** `count` placeholder items cycling the skeleton mix, so loading looks like the feed. */
export const masonrySkeletonItems = (count: number): { id: string; aspect: number }[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `skeleton-${index}`,
    aspect: MASONRY_SKELETON_ASPECTS[index % MASONRY_SKELETON_ASPECTS.length] as number,
  }))

export interface MasonryGeometry {
  columns: number
  columnWidth: number
  gap: number
}

/** Column count and width for a container: `max(2, ⌊(w + gap) / (248 + gap)⌋)`, centred. */
export function masonryGeometry(containerWidth: number): MasonryGeometry {
  if (containerWidth < MASONRY_NARROW_WIDTH) {
    return {
      columns: 2,
      columnWidth: (containerWidth - MASONRY_NARROW_GAP) / 2,
      gap: MASONRY_NARROW_GAP,
    }
  }
  return {
    columns: Math.max(
      2,
      Math.floor((containerWidth + MASONRY_GAP) / (MASONRY_COLUMN_WIDTH + MASONRY_GAP)),
    ),
    columnWidth: MASONRY_COLUMN_WIDTH,
    gap: MASONRY_GAP,
  }
}

/** A card's full height: aspect-derived art window + frame chrome + the grid's meta/footer rows. */
export function masonryCardHeight(
  aspect: number,
  columnWidth: number,
  chromeHeight: number,
): number {
  return (columnWidth - MEDIA_CHROME_X) / aspect + MEDIA_CHROME_Y + chromeHeight
}

export interface MasonryPlacement {
  column: number
  x: number
  y: number
  width: number
  height: number
}

export interface MasonryLayout extends MasonryGeometry {
  items: MasonryPlacement[]
  /** container height: the deepest column's bottom edge */
  height: number
  /** per-column running *content* heights — gaps excluded, matching the choice rule */
  columnContentHeights: number[]
  /** per-column item counts, for the gap arithmetic on append */
  columnCounts: number[]
  chromeHeight: number
}

export interface LayoutMasonryInput extends MasonryGeometry {
  aspects: readonly number[]
  /** fixed per-grid height under the art: frame-to-card meta rows plus any screen footer */
  chromeHeight: number
}

/** Lay a feed out from scratch. */
export function layoutMasonry(input: LayoutMasonryInput): MasonryLayout {
  const empty: MasonryLayout = {
    columns: input.columns,
    columnWidth: input.columnWidth,
    gap: input.gap,
    chromeHeight: input.chromeHeight,
    items: [],
    height: 0,
    columnContentHeights: Array.from({ length: input.columns }, () => 0),
    columnCounts: Array.from({ length: input.columns }, () => 0),
  }
  return appendMasonry(empty, input.aspects)
}

/** Place more items against the existing column state; prior placements never move. */
export function appendMasonry(prev: MasonryLayout, aspects: readonly number[]): MasonryLayout {
  const contentHeights = [...prev.columnContentHeights]
  const counts = [...prev.columnCounts]
  const items = [...prev.items]
  for (const aspect of aspects) {
    // shortest column by content height alone; ties go to the leftmost
    let column = 0
    for (let c = 1; c < prev.columns; c++) {
      if ((contentHeights[c] ?? 0) < (contentHeights[column] ?? 0)) column = c
    }
    const height = masonryCardHeight(aspect, prev.columnWidth, prev.chromeHeight)
    const y = (contentHeights[column] ?? 0) + (counts[column] ?? 0) * prev.gap
    items.push({
      column,
      x: column * (prev.columnWidth + prev.gap),
      y,
      width: prev.columnWidth,
      height,
    })
    contentHeights[column] = (contentHeights[column] ?? 0) + height
    counts[column] = (counts[column] ?? 0) + 1
  }
  let bottom = 0
  for (let c = 0; c < prev.columns; c++) {
    const count = counts[c] ?? 0
    if (count === 0) continue
    bottom = Math.max(bottom, (contentHeights[c] ?? 0) + (count - 1) * prev.gap)
  }
  return {
    ...prev,
    items,
    height: bottom,
    columnContentHeights: contentHeights,
    columnCounts: counts,
  }
}
