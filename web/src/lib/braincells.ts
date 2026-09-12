/**
 * `🧠 2,480` — the brain mark, one space, the grouped number.
 *
 * The glyph is the product's own word for the currency (PRODUCT.md), so it is written inline rather
 * than drawn, and it stays an emoji. What kept drifting is the space after it: the same file could
 * read `🧠 1,200` on one line and `🧠1,200` on the next, and the two set differently. One spelling
 * lives here; a caller that needs a suffix ("/share") appends it to the result.
 */
export function braincells(amount: number | string): string {
  return `🧠 ${typeof amount === 'number' ? amount.toLocaleString() : amount}`
}
