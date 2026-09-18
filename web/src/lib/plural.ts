/**
 * Real data has counts of one — a meme reshared exactly once, a card with one view — and
 * "1 reshares" is the tell that a label was assembled, not written. Both halves are exported:
 * markup that already prints the figure only needs the noun.
 */
export const pluralWord = (count: number, word: string): string => (count === 1 ? word : `${word}s`)

export const plural = (count: number, word: string): string =>
  `${count.toLocaleString()} ${pluralWord(count, word)}`
