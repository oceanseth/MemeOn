import { sharedCopy } from './shared'

/** Every string the gift dialog spells for chrome, search, rows and submission. */
export const giftDialogCopy = {
  title: (name: string) => `🎁 Gift to ${name}`,
  hint: 'Pick a meme you hold shares in — the transfer is free and instant.',
  close: 'Close gift dialog',
  cancel: sharedCopy.cancel,
  search: 'Search your binder',
  listed: 'Listed',
  sharesHeld: (held: number) => `you hold ${held} of 100`,
  emptyBinder: 'Nothing to gift here — you need shares in a meme first.',
  emptySearch: (query: string) => `Nothing in your binder matches "${query}".`,
  sharesField: 'shares',
  sharesMax: (maxShares: number) => `of ${maxShares}`,
  sharesA11y: (maxShares: number) => `Shares to gift, up to ${maxShares}`,
  submit: {
    busy: 'Gifting…',
    choose: 'Choose a meme to gift',
    gift: (shares: number, title: string) => `Gift ${shares} of "${title}"`,
  },
} as const
