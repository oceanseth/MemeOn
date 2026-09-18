/** Strings the meme card builder spells for listing state, stats and media controls. */
export const memeCardCopy = {
  forSale: 'for sale',
  shares: (count: number) => `${count} shares`,
  sharesForSaleAt: (shares: number, pricePerShare: number) =>
    `${shares} shares for sale at ${pricePerShare} braincells each`,
  open: (title: string) => `Open ${title}`,
  play: (title: string) => `Play ${title}`,
  stats: (viewsLabel: string | null, resharesLabel: string) =>
    viewsLabel ? `${viewsLabel} views, ${resharesLabel} reshares` : `${resharesLabel} reshares`,
  valueA11y: (valueLabel: string) => `${valueLabel} braincells card value`,
} as const
