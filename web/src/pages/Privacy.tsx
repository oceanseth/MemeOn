export default function Privacy() {
  return (
    <main className="container legal">
      <h1>Privacy Policy</h1>
      <p className="legal-date">Last updated: July 6, 2026</p>

      <h2>The short version</h2>
      <p>
        MemeOn is built to know as little about you as possible. You sign in with Masky, which
        gives us a pseudonymous avatar identity — <strong>we never receive your real name, email
        address, or Masky account id</strong>. We don't sell data, we don't run ads, and we don't
        track you across other sites.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Avatar identity from Masky SSO:</strong> a pseudonymous id (unique to MemeOn and
          uncorrelatable with other sites), your avatar's display name and picture. That's the
          whole identity.
        </li>
        <li>
          <strong>Things you do on MemeOn:</strong> memes you mint or upload, share positions,
          listings, trades, friendships, follows, likes and passes, quest progress, braincell
          balance, and alerts. This is the product working as intended.
        </li>
        <li>
          <strong>Reshare counts:</strong> loads of a meme's share link increment a counter. We
          count the event, not who loaded it.
        </li>
        <li>
          <strong>Online presence:</strong> while signed in, a "who's online" flag keyed to your
          pseudonymous id (Firebase Realtime Database), visible only to signed-in users and
          removed when you disconnect.
        </li>
        <li>
          <strong>Discord (optional):</strong> if you run <code>/memeon-connect</code>, we store
          your Discord user id linked to your MemeOn account so search can rank your binder and
          friends first. Nothing else about your Discord account is read or stored, and the link
          is never shown to other users.
        </li>
      </ul>

      <h2>What we never collect</h2>
      <p>
        Real names, email addresses, phone numbers, contacts, precise location, or payment
        details. AI generation runs on your own Masky credits — billing happens at Masky, not
        here. Braincells are play currency with no monetary value.
      </p>

      <h2>Where it lives</h2>
      <p>
        Data is stored on Amazon Web Services (US) and Google Firebase (presence only). Sign-in
        and generation are provided by Masky (masky.ai) under their own privacy policy. Some
        archive memes embed media hosted by GIPHY, credited on the card.
      </p>

      <h2>Deletion</h2>
      <p>
        Sole owners can make any meme private (removing it from all public surfaces). To delete
        your account and its data, email{' '}
        <a href="mailto:seth@voicecert.com">seth@voicecert.com</a> from a message linked to your
        avatar identity and we'll remove it within 30 days. Revoking MemeOn's access from your
        Masky account (masky.ai/developer → Connected apps) ends our ability to act on your
        behalf immediately.
      </p>

      <h2>Age</h2>
      <p>MemeOn is not intended for children under 13.</p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially we'll note it here with a new date. Questions:{' '}
        <a href="mailto:seth@voicecert.com">seth@voicecert.com</a>.
      </p>
    </main>
  )
}
