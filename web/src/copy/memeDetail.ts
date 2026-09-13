import { braincells } from '../lib/braincells'
import { plural, pluralWord } from '../lib/plural'
import { sharedCopy } from './shared'

/** Every string the Meme detail screen shows. Keys name the role, not the content. */
export const memeDetailCopy = {
  loading: 'Pulling the card…',
  notFound: {
    message: "This meme isn't here — it may have been deleted or made private.",
    browse: sharedCopy.browseMarketplace,
  },
  /** cap-table and seller names when the holder is the reader, or not yet resolved */
  holder: {
    you: 'You',
    unknown: 'another collector',
  },
  hero: {
    /** "Prismatic · 5,800 reshares" */
    tierLine: (tierName: string, reshares: number) => `${tierName} · ${reshares.toLocaleString()} ${pluralWord(reshares, 'reshare')}`,
    tierLabel: (tierName: string, rarity: string) => `${tierName} · ${rarity}`,
    /** "via GIPHY (@author)" */
    source: (provider: string, author: string | null | undefined) => `via ${provider.toUpperCase()}${author ? ` (@${author})` : ''}`,
  },
  ladder: {
    current: (tierName: string) => `${tierName} is spreading`,
    next: (remaining: number, nextTierName: string) => `${remaining.toLocaleString()} more views → ${nextTierName}`,
    top: (tierName: string) => `Top of the ladder — ${tierName} is as rare as it gets ✨`,
    meterLabel: 'Progress to the next tier',
    topValueText: (tierName: string) => `${tierName} is the top tier`,
  },
  stats: {
    viewsWord: (views: number) => pluralWord(views, 'view'),
    resharesWord: (reshares: number) => pluralWord(reshares, 'reshare'),
    /** spoken names for the compact stat row, whose glyphs are decorative */
    srLabel: (views: number, reshares: number) => `${plural(views, 'view')}, ${plural(reshares, 'reshare')}`,
    valueSrLabel: (value: number) => `${value.toLocaleString()} braincells card value`,
  },
  share: {
    inputLabel: 'Share link for this meme',
    copy: 'Copy link',
    copied: sharedCopy.copied,
  },
  listing: {
    sale: (shares: number, pricePerShare: number) => `${plural(shares, 'share')} up for grabs · ${braincells(pricePerShare)} each`,
    /** the compact figures beside the sale line; the noun is fixed, as it always was */
    shares: (shares: number) => `${shares} shares`,
    price: (pricePerShare: number) => `${braincells(pricePerShare)}/share`,
    buyInputLabel: 'shares to buy',
    /** the card's caption: what the viewer can spend, and the invitation to pick an amount */
    balance: (coins: number) => `You’ve got ${braincells(coins)}. Pick how much of the joke you want.`,
    pickAtLeastOne: 'Pick at least 1 share.',
    short: (shortBy: number) => `${braincells(shortBy)} short — sell some shares or open a pack first.`,
    buy: 'Buy shares',
    buyFor: (total: number) => `Buy for ${braincells(total)}`,
    buying: 'Buying…',
    unlist: 'Remove listing',
    unlisting: 'Removing…',
  },
  list: {
    onlyHold: (shares: number) => `You only hold ${shares} shares.`,
    minPrice: `Set a price of at least ${braincells('0.01')} per share.`,
    submit: 'List',
    submitting: 'Listing…',
  },
  toasts: {
    bought: 'Shares acquired 💼',
    delisted: 'Delisted',
    listed: 'Listed on the marketplace 🏷️',
    madePublic: 'Back on the marketplace 🌐',
    madePrivate: 'Hidden from the marketplace 🙈 (still in your binder)',
    claimed: 'Claim filed 📼 — we’ll review it and transfer the card if it checks out.',
  },
  /** fallbacks when a failed request carries no message of its own */
  errors: {
    action: 'action failed',
    login: 'login failed',
    delete: 'delete failed',
  },
  actions: {
    remix: '🧬 Create a meme from this',
    claim: '📼 This is my meme — claim it',
    makePublic: '🌐 Make public',
    makePrivate: '🙈 Make private',
    delete: '🗑️ Delete forever',
  },
  memeplex: {
    added: 'Added to the memeplex 🕸️',
    alreadyLinked: 'Already in the memeplex.',
    isThisMeme: "That's this meme — already the center of its own memeplex.",
    addFailed: 'failed to add',
  },
  capTable: {
    title: 'Who holds this card · 100 shares',
    /** who is selling and how much; `sellerName` null means the reader is the seller */
    note: (shares: number, sellerName: string | null) =>
      `${plural(shares, 'share')} of ${sellerName === null ? 'yours' : `${sellerName}’s`} ${shares === 1 ? 'is' : 'are'} listed`,
  },
  signedOut: {
    title: 'Own a piece of this',
    body: 'Log in with Masky to buy, remix, or mint your own.',
    /** Lead with the listing offer when there is one. */
    bodyListed: (shares: number, pricePerShare: number) =>
      `${plural(shares, 'share')} listed at ${braincells(pricePerShare)} each. Log in with Masky to buy, remix, or mint your own.`,
    login: sharedCopy.masky.logInButton,
    loginLabel: sharedCopy.masky.logIn,
    redirecting: sharedCopy.masky.redirecting,
    redirectingLabel: sharedCopy.masky.redirectingTo,
    browse: sharedCopy.browseMarketplace,
  },
  /** the meme's own title, quoted, as the dialogs restate it in bold */
  quotedTitle: (title: string) => `"${title}"`,
  deleteDialog: {
    title: 'Delete this meme forever?',
    /** follows the bold quoted title */
    body: ' will be permanently removed — its card, share link, view history, and memeplex links all go with it. This cannot be undone.',
    confirm: 'Delete it forever',
  },
  buyDialog: {
    title: (total: number) => `Spend ${braincells(total)}?`,
    /** precedes the bold quoted title */
    lead: (shares: number) => `${shares} ${pluralWord(shares, 'share')} of `,
    /** follows the bold quoted title */
    tail: (pricePerShare: number, coins: number) => ` at ${braincells(pricePerShare)}/share. You hold ${braincells(coins)}, and purchases are final.`,
    confirm: (shares: number) => `Buy ${shares} ${pluralWord(shares, 'share')}`,
  },
  claimDialog: {
    title: 'Claim this meme?',
    body: 'This card is sitting in the archive. Tell us why it belongs to you and we’ll take a look.',
    confirm: 'File the claim',
    prompt: {
      label: 'Why is this meme yours?',
      placeholder: 'the original post, your handle, anything that proves it',
      hint: 'Links help your case.',
    },
  },
} as const
