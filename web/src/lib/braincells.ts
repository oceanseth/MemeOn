/**
 * `2,480` — the grouped number, no mark. The brain glyph is drawn by the `Icon` atom beside any
 * figure this helper formats (an icon, not a text glyph, so it stays out of the copy/paste stream
 * and the accessible name). A caller that needs a suffix ("/share") appends it to the result.
 */
export function braincells(amount: number | string): string {
  return typeof amount === 'number' ? amount.toLocaleString() : amount
}
