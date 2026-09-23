import { plural, pluralWord } from '../lib/plural'

/** Strings the meme card builder spells for listing state and stats. */
export const memeCardCopy = {
  forSale: 'for sale',
  shares: (count: number) => `${count} ${pluralWord(count, 'share')}`,
  sharesForSaleAt: (shares: number, pricePerShare: number) =>
    `${shares} ${pluralWord(shares, 'share')} for sale at ${pricePerShare} braincells each`,
  open: (title: string) => `Open ${title}`,
  /** Spoken name. The visible figures are compact; this stays the exact count. */
  stats: (views: number | null, reshares: number) =>
    views === null
      ? plural(reshares, 'reshare')
      : `${plural(views, 'view')}, ${plural(reshares, 'reshare')}`,
  valueA11y: (valueLabel: string) => `${valueLabel} braincells card value`,
  tierLabel: (name: string, rarity: string) => `${name} · ${rarity}`,
} as const
