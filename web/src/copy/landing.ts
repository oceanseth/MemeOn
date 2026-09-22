import { sharedCopy } from './shared'

/** Every string the Landing screen's engine supplies. Keys name the role of the string, not its content. */
export const landingCopy = {
  hero: {
    title: 'Memes are the new trading cards',
    body: 'Mint the moment. Watch it spread. Trade the cards everyone sends each other anyway — every meme gets a share link whose foil frame levels up as it travels.',
    loginAside: 'No email. No real name. Just your Masky avatar.',
    /** The three figures under the title. The value is a number the builder formats; this is the noun. */
    stats: {
      tiers: 'rarity tiers',
      shares: 'shares a card',
      reshares: (topTier: string) => `reshares to ${topTier}`,
    },
  },
  /** Distinct from sharedCopy.browseMarketplace ("Browse the marketplace"). */
  marketplaceCta: 'Enter the marketplace',
  how: {
    title: 'A card gets better when it gets around.',
    steps: [
      {
        step: '01',
        title: 'Mint a moment',
        body: 'Turn an image, video, Giphy, or URL into a card.',
      },
      {
        step: '02',
        title: 'Drop the link',
        body: 'Every share unfurls with its live foil frame.',
      },
      {
        step: '03',
        title: 'Go Shiny',
        body: 'Reshares push Paper cards up the virality tiers.',
      },
    ],
  },
  tier: {
    /** Ladder card middle line: "0 reshares" … "25,000 reshares". */
    reshares: (count: number) => `${count.toLocaleString()} reshares`,
  },
  film: {
    /** Section heading. Play/mute/aria stay on heroVideoCopy. */
    title: 'MemeOn in 50 seconds',
  },
  faq: {
    /** All-caps single token; the ratchet's isCopyLike may skip it. */
    title: 'FAQ',
    items: [
      {
        id: 'level-up',
        question: 'How does a card level up?',
        body: 'Each unique share link and card unfurl counts as a reshare. Cross a threshold and the meme tiers up: Paper → Silver → Holo → Chrome → Gold → Prismatic → Shiny. The link preview card (the og image) upgrades its foil frame automatically, so a Gold meme flexes gold wherever it lands.',
      },
      {
        id: 'private',
        question: 'Can I keep a meme private?',
        body: 'Only a meme’s sole owner can make it private — that pulls it off every public surface. Once shares are split between holders it stays in the market.',
      },
      {
        id: 'what',
        question: 'WTF is MemeOn?',
        body: 'A meme trading card market. You mint memes (upload or generate them with your Masky credits), each one becomes a 100-share collectible card, and its rarity tier is driven by real reshares of its unique link.',
      },
      {
        id: 'braincells',
        question: 'What are braincells?',
        body: "Braincells are MemeOn's currency — you buy meme shares, fund trades, and flex on the Top Brains leaderboard with them. Everyone starts at zero (smoothbrained, sorry) and earns their first braincells through the onboarding quests: claim your free starter pack, mint your first meme, get your first reshare, make a friend, close a trade. AI generation is separate — that runs on your own Masky credits.",
        imageAlt: 'a braincell',
      },
      {
        id: 'tiers',
        question: 'How do tiers work?',
        body: "Every meme has a share URL (memeon.ai/m/…). Each time that link is loaded — a friend clicks it, Discord unfurls it, a bot scrapes it — the counter ticks up, and every new place it's shared is counted separately as a reshare. Seven tiers, from Paper at zero to Shiny at 25,000.",
      },
      {
        id: 'masky',
        question: "What's Masky got to do with it?",
        body: 'Login is "Log in with Masky" — your Masky avatar is your identity here, and meme generation (images and videos) runs on your own Masky credits. Your real identity stays protected: MemeOn only ever sees your avatar, never who\'s behind the mask. And your avatar can do more than represent you — configure an agentic harness for it on Masky and it runs as an agent on your behalf: auto-approving or proposing trades, minting new memes with AI, watching for memes catching reshare momentum, and generally maximizing your braincells while you sleep.',
      },
    ],
  },
  login: {
    label: sharedCopy.masky.logInButton,
    /** The button's accessible name; the visible label carries the mask. */
    name: sharedCopy.masky.logIn,
    busyLabel: sharedCopy.masky.redirecting,
    busyName: sharedCopy.masky.redirectingTo,
  },
  /** The closing card: the page finishes convincing there, so the CTA repeats under it. */
  closing: {
    lineLoggedIn: 'Your binder is waiting.',
    lineLoggedOut: 'Your next group-chat classic is a card already.',
    label: 'Grab your pack with Masky',
    name: 'Grab your pack with Masky',
    busyLabel: sharedCopy.masky.redirecting,
    busyName: 'Redirecting to Masky for your pack',
  },
  errors: {
    /** Thrown strings never reach the page: one authored sentence that names the recovery. */
    login: "Masky didn't answer. Tap Log in with Masky to try again.",
  },
  /** Machine fallback when Masky login throws without a message. */
  machine: { loginFailed: 'login failed' },
} as const
