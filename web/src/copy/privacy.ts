/** Every string the Privacy screen shows. Keys name the role, not the content. */
export const privacyCopy = {
  title: 'Privacy Policy',
  updated: {
    datetime: '2026-07-06',
    label: 'July 6, 2026',
    prefix: 'Last updated:',
  },
  tocLabel: 'On this page',
  crossLink: { to: '/terms', label: 'Terms of Service' },
  shortVersion: {
    heading: 'The short version',
    intro: 'MemeOn is built to know as little about you as possible.',
    maskyLead: 'You sign in with Masky, which gives us a pseudonymous avatar identity —',
    maskyStrong: 'we never receive your real name, email address, or Masky account id',
    noAds: 'We don’t sell data, we don’t run ads, and we don’t track you across other sites.',
  },
  whatWeCollect: {
    heading: 'What we collect',
    items: [
      {
        strong: 'Avatar identity from Masky SSO:',
        body: 'a pseudonymous id (unique to MemeOn and uncorrelatable with other sites), your avatar’s display name and picture. That’s the whole identity.',
      },
      {
        strong: 'Things you do on MemeOn:',
        body: 'memes you mint or upload, share positions, listings, trades, friendships, follows, likes and passes, quest progress, braincell balance, and alerts. This is the product working as intended.',
      },
      {
        strong: 'Reshare counts:',
        body: 'loads of a meme’s share link increment a counter. We count the event, not who loaded it.',
      },
      {
        strong: 'Online presence:',
        body: 'while signed in, a “who’s online” flag keyed to your pseudonymous id (Firebase Realtime Database), visible only to signed-in users and removed when you disconnect.',
      },
    ],
    /** the slash command renders as code, so the sentence is split around it */
    discord: {
      strong: 'Discord (optional):',
      lead: 'if you run',
      command: '/memeon-connect',
      body: ', we store your Discord user id linked to your MemeOn account so search can rank your binder and friends first. Nothing else about your Discord account is read or stored, and the link is never shown to other users.',
    },
  },
  whatWeNeverCollect: {
    heading: 'What we never collect',
    body: 'Real names, email addresses, phone numbers, contacts, precise location, or payment details. AI generation runs on your own Masky credits — billing happens at Masky, not here. Braincells are play currency with no monetary value.',
  },
  whereItLives: {
    heading: 'Where it lives',
    body: 'Data is stored on Amazon Web Services (US) and Google Firebase (presence only). Sign-in and generation are provided by Masky (masky.ai) under their own privacy policy. Some archive memes embed media hosted by GIPHY, credited on the card.',
  },
  deletion: {
    heading: 'Deletion',
    makePrivate: { text: 'make any meme private', to: '/binder' },
    privateSuffix: '(removing it from all public surfaces). To delete your account and its data, email',
    email: 'seth@voicecert.com',
    emailSubject: 'MemeOn account deletion',
    afterEmail:
      'from a message linked to your avatar identity and we’ll remove it within 30 days. Revoking MemeOn’s access from your Masky account (',
    maskyDeveloper: { text: 'masky.ai/developer → Connected apps', href: 'https://masky.ai/developer' },
    closing: ') ends our ability to act on your behalf immediately.',
    ownersLead: 'Sole owners can',
  },
  age: {
    heading: 'Age',
    body: 'MemeOn is not intended for children under 13.',
  },
  changes: {
    heading: 'Changes',
    lead: 'If this policy changes materially we’ll note it here with a new date. Questions:',
    email: 'seth@voicecert.com',
    emailSubject: 'MemeOn privacy question',
  },
} as const
