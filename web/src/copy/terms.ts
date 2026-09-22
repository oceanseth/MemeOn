/** Every string the Terms screen shows. Keys name the role, not the content. */
export const termsCopy = {
  title: 'Terms of Service',
  updated: {
    datetime: '2026-07-06',
    label: 'July 6, 2026',
    prefix: 'Last updated:',
  },
  tocLabel: 'On this page',
  crossLink: { to: '/privacy', label: 'Privacy Policy' },
  whatMemeonIs: {
    heading: 'What MemeOn is',
    intro:
      'MemeOn is an entertainment product: memes become collectible cards whose rarity tiers follow real reshares, and users trade positions in them using braincells.',
    currencyStrong: 'Braincells are a play currency with no monetary value.',
    disclaimer:
      'They cannot be purchased, sold, redeemed, or exchanged for money or anything of value. Nothing on MemeOn is an investment, security, or financial product, and card “values” are game mechanics, not prices.',
  },
  yourAccount: {
    heading: 'Your account',
    body: 'You sign in through Masky and are responsible for activity under your avatar. You must be 13 or older. We may suspend accounts that abuse the service (spam minting, reshare manipulation, harassment, or attempts to exploit the economy).',
  },
  yourContent: {
    heading: 'Your content',
    bodyBeforeLink:
      'You keep whatever rights you hold in memes you mint or upload, and you grant MemeOn a license to host, display, resize, and composite them (including into share-card images) to operate the service. Only mint content you have the right to use. Memes generated through Masky are also subject to',
    maskyTerms: { text: 'Masky’s terms', href: 'https://masky.ai' },
    bodyAfterLink: '.',
  },
  claimsAndTakedowns: {
    heading: 'Claims and takedowns',
    lead: 'Archive memes can be claimed by their original creators through',
    claimFlow: { text: 'the in-app claim flow', to: '/marketplace' },
    mid: 'If content on MemeOn infringes your rights, email',
    email: 'seth@voicecert.com',
    emailSubject: 'MemeOn takedown request',
    tail: 'with the meme link and the basis of your claim, and we’ll review and remove or transfer it as appropriate.',
  },
  marketIsAGame: {
    heading: 'The market is a game',
    intro:
      'We may adjust braincell rewards, tier thresholds, card values, quests, and other economy mechanics at any time to keep the game fun and fair.',
    tradesStrong: 'Trades and purchases are final.',
    reshare:
      'Reshare counts reflect link loads, including automated ones — that’s the mechanic, not a bug.',
  },
  thirdPartyServices: {
    heading: 'Third-party services',
    signInLead: 'Sign-in and AI generation are provided by Masky under',
    maskyTerms: { text: 'their terms', href: 'https://masky.ai' },
    signInTail: '; generation spends your Masky credits. The Discord integration is subject to',
    discordTerms: {
      text: 'Discord’s terms',
      href: 'https://discord.com/terms',
    },
    giphyLead: '. Some archive media is served by',
    giphy: { text: 'GIPHY', href: 'https://giphy.com' },
    giphyTail: 'with attribution.',
  },
  noWarranty: {
    heading: 'No warranty',
    body: 'MemeOn is provided as-is, without warranties. To the maximum extent permitted by law, our liability is limited to the amount you paid us to use MemeOn, which is zero.',
  },
  contact: {
    heading: 'Contact',
    email: 'seth@voicecert.com',
    emailSubject: 'MemeOn terms question',
  },
} as const
