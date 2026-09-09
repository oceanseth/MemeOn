import { Link } from 'react-router-dom'

/** Static terms of service. No engine — copy only. */
export function TermsScreen() {
  return (
    <main className="container legal" id="main" tabIndex={-1}>
      <h1>Terms of Service</h1>
      <p className="legal-date">
        Last updated: <time dateTime="2026-07-06">July 6, 2026</time>
      </p>

      <nav aria-label="On this page">
        <ul className="legal-toc">
          <li>
            <a href="#what-memeon-is">What MemeOn is</a>
          </li>
          <li>
            <a href="#your-account">Your account</a>
          </li>
          <li>
            <a href="#your-content">Your content</a>
          </li>
          <li>
            <a href="#claims-and-takedowns">Claims and takedowns</a>
          </li>
          <li>
            <a href="#the-market-is-a-game">The market is a game</a>
          </li>
          <li>
            <a href="#third-party-services">Third-party services</a>
          </li>
          <li>
            <a href="#no-warranty">No warranty</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <h2 id="what-memeon-is">What MemeOn is</h2>
      <p>
        MemeOn is an entertainment product: memes become collectible cards whose rarity tiers
        follow real reshares, and users trade positions in them using braincells.
      </p>
      <p className="legal-key">
        <strong>Braincells are a play currency with no monetary value.</strong>
      </p>
      <p>
        They cannot be purchased, sold, redeemed, or exchanged for money or anything of value.
        Nothing on MemeOn is an investment, security, or financial product, and card “values” are
        game mechanics, not prices.
      </p>

      <h2 id="your-account">Your account</h2>
      <p>
        You sign in through Masky and are responsible for activity under your avatar. You must be
        13 or older. We may suspend accounts that abuse the service (spam minting, reshare
        manipulation, harassment, or attempts to exploit the economy).
      </p>

      <h2 id="your-content">Your content</h2>
      <p>
        You keep whatever rights you hold in memes you mint or upload, and you grant MemeOn a
        license to host, display, resize, and composite them (including into share-card images)
        to operate the service. Only mint content you have the right to use. Memes generated
        through Masky are also subject to{' '}
        <a href="https://masky.ai" target="_blank" rel="noopener noreferrer">
          Masky’s terms
        </a>
        .
      </p>

      <h2 id="claims-and-takedowns">Claims and takedowns</h2>
      <p>
        Archive memes can be claimed by their original creators through{' '}
        <Link to="/marketplace">the in-app claim flow</Link>. If content on MemeOn infringes your
        rights, email{' '}
        <a href="mailto:seth@voicecert.com?subject=MemeOn%20takedown%20request">
          seth@voicecert.com
        </a>{' '}
        with the meme link and the basis of your claim, and we’ll review and remove or transfer it
        as appropriate.
      </p>

      <h2 id="the-market-is-a-game">The market is a game</h2>
      <p>
        We may adjust braincell rewards, tier thresholds, card values, quests, and other economy
        mechanics at any time to keep the game fun and fair.
      </p>
      <p className="legal-key">
        <strong>Trades and purchases are final.</strong>
      </p>
      <p>
        Reshare counts reflect link loads, including automated ones — that’s the mechanic, not a
        bug.
      </p>

      <h2 id="third-party-services">Third-party services</h2>
      <p>
        Sign-in and AI generation are provided by Masky under{' '}
        <a href="https://masky.ai" target="_blank" rel="noopener noreferrer">
          their terms
        </a>
        ; generation spends your Masky credits. The Discord integration is subject to{' '}
        <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer">
          Discord’s terms
        </a>
        . Some archive media is served by{' '}
        <a href="https://giphy.com" target="_blank" rel="noopener noreferrer">
          GIPHY
        </a>{' '}
        with attribution.
      </p>

      <h2 id="no-warranty">No warranty</h2>
      <p>
        MemeOn is provided as-is, without warranties. To the maximum extent permitted by law, our
        liability is limited to the amount you paid us to use MemeOn, which is zero.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        <a href="mailto:seth@voicecert.com?subject=MemeOn%20terms%20question">
          seth@voicecert.com
        </a>
      </p>
      <p className="legal-more">
        See also: <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  )
}
