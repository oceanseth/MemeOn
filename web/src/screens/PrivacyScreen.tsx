import { Link } from 'react-router-dom'

/** Static privacy policy. No engine — copy only. */
export function PrivacyScreen() {
  return (
    <main className="container legal" id="main" tabIndex={-1}>
      <h1>Privacy Policy</h1>
      <p className="legal-date">
        Last updated: <time dateTime="2026-07-06">July 6, 2026</time>
      </p>

      <nav aria-label="On this page">
        <ul className="legal-toc">
          <li>
            <a href="#short-version">The short version</a>
          </li>
          <li>
            <a href="#what-we-collect">What we collect</a>
          </li>
          <li>
            <a href="#what-we-never-collect">What we never collect</a>
          </li>
          <li>
            <a href="#where-it-lives">Where it lives</a>
          </li>
          <li>
            <a href="#deletion">Deletion</a>
          </li>
          <li>
            <a href="#age">Age</a>
          </li>
          <li>
            <a href="#changes">Changes</a>
          </li>
        </ul>
      </nav>

      <h2 id="short-version">The short version</h2>
      <p>MemeOn is built to know as little about you as possible.</p>
      <p className="legal-key">
        You sign in with Masky, which gives us a pseudonymous avatar identity —{' '}
        <strong>we never receive your real name, email address, or Masky account id</strong>.
      </p>
      <p>
        We don’t sell data, we don’t run ads, and we don’t track you across other sites.
      </p>

      <h2 id="what-we-collect">What we collect</h2>
      <ul>
        <li>
          <strong>Avatar identity from Masky SSO:</strong> a pseudonymous id (unique to MemeOn and
          uncorrelatable with other sites), your avatar’s display name and picture. That’s the
          whole identity.
        </li>
        <li>
          <strong>Things you do on MemeOn:</strong> memes you mint or upload, share positions,
          listings, trades, friendships, follows, likes and passes, quest progress, braincell
          balance, and alerts. This is the product working as intended.
        </li>
        <li>
          <strong>Reshare counts:</strong> loads of a meme’s share link increment a counter. We
          count the event, not who loaded it.
        </li>
        <li>
          <strong>Online presence:</strong> while signed in, a “who’s online” flag keyed to your
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

      <h2 id="what-we-never-collect">What we never collect</h2>
      <p>
        Real names, email addresses, phone numbers, contacts, precise location, or payment
        details. AI generation runs on your own Masky credits — billing happens at Masky, not
        here. Braincells are play currency with no monetary value.
      </p>

      <h2 id="where-it-lives">Where it lives</h2>
      <p>
        Data is stored on Amazon Web Services (US) and Google Firebase (presence only). Sign-in
        and generation are provided by Masky (masky.ai) under their own privacy policy. Some
        archive memes embed media hosted by GIPHY, credited on the card.
      </p>

      <h2 id="deletion">Deletion</h2>
      <p>
        Sole owners can <Link to="/binder">make any meme private</Link> (removing it from all
        public surfaces). To delete your account and its data, email{' '}
        <a href="mailto:seth@voicecert.com?subject=MemeOn%20account%20deletion">
          seth@voicecert.com
        </a>{' '}
        from a message linked to your avatar identity and we’ll remove it within 30 days. Revoking
        MemeOn’s access from your Masky account (
        <a href="https://masky.ai/developer" target="_blank" rel="noopener noreferrer">
          masky.ai/developer → Connected apps
        </a>
        ) ends our ability to act on your behalf immediately.
      </p>

      <h2 id="age">Age</h2>
      <p>MemeOn is not intended for children under 13.</p>

      <h2 id="changes">Changes</h2>
      <p>
        If this policy changes materially we’ll note it here with a new date. Questions:{' '}
        <a href="mailto:seth@voicecert.com?subject=MemeOn%20privacy%20question">
          seth@voicecert.com
        </a>
        .
      </p>
      <p className="legal-more">
        See also: <Link to="/terms">Terms of Service</Link>.
      </p>
    </main>
  )
}
