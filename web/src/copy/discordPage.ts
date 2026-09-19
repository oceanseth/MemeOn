/** Every string the Discord install page shows. Keys name the role, not the content. */
export const discordPageCopy = {
  pageTitle: 'MemeOn for Discord',
  pitch:
    'The GIF picker, but the cards level up. Type /memeon in any chat, drop a live card, and every unfurl counts as a reshare.',
  busy: 'Checking Discord…',
  cta: {
    label: 'Add MemeOn to Discord',
    newTabNote: 'opens Discord in a new tab',
  },
  pending: 'Almost live — the Discord app is being registered. Check back soon!',
  error: "Couldn't reach MemeOn — reload to try again.",
  howHeading: 'How it works',
  steps: [
    {
      command: '/memeon',
      title: 'Search live cards',
      body: "Your binder and friends' memes rank first.",
    },
    {
      command: '/memeon-connect',
      title: 'Make it yours',
      body: 'A private link connects one Masky account.',
    },
    {
      command: 'Paper → Shiny',
      title: 'Make every drop matter',
      body: 'Every post ticks the reshare counter.',
    },
  ],
  faq: {
    heading: 'Tiny FAQ',
    admin: {
      question: 'Does this need a server admin?',
      lead: 'No.',
      choose: 'Choose',
      addToMyApps: 'Add to My Apps',
      rest: 'for every server and DM, or add it to a server you manage.',
    },
    identity: {
      question: 'Is my Discord identity public?',
      body: 'Never. It only improves your own ranked search.',
    },
  },
  assets: {
    heading: 'MemeOn brain assets',
    fullSize: 'Full size',
    round: 'Round',
  },
  /** first sentence of the install steps: the FAQ may not point at a button that is not there */
  installSteps: {
    live: 'Hit the button above.',
    pending: 'The button above goes live the moment the app is registered.',
  },
} as const
