import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'

/** Discord install landing as a function of its model. Every engine state is one set of args. */
export function DiscordPageScreen({
  showLoading,
  showInstall,
  showPending,
  showError,
  installSteps,
  installLinkProps,
}: DiscordPageScreenModel) {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <section className="hero">
        <h1>
          MemeOn <span className="grad">for Discord</span>
        </h1>
        <p>
          The GIF picker, but the cards level up. Type <code>/memeon</code> in any chat, search with
          live results — your binder 💼 and friends' memes 🤝 rank first — and drop a card. Every
          card posted is a share link: it unfurls with its current foil tier frame and{' '}
          <strong>counts as a reshare</strong>, pushing the meme up the tiers.
        </p>
        {/* one reserved box for every phase, so the CTA never pops the page down when config lands */}
        <div className="cta-slot">
          {showLoading && (
            <span className="btn primary login-btn" aria-disabled="true">
              <span className="spin" aria-hidden="true" />
              Checking Discord…
            </span>
          )}
          {showInstall && (
            <a {...installLinkProps} className="btn primary login-btn">
              🧠 Add MemeOn to Discord
              <span className="sr-only"> (opens Discord in a new tab)</span>
            </a>
          )}
          {showPending && (
            <p className="notice info" role="status">
              Almost live — the Discord app is being registered. Check back soon!
            </p>
          )}
          {showError && (
            <p className="notice error" role="alert">
              Couldn't reach MemeOn — reload to try again.
            </p>
          )}
        </div>
      </section>

      <section className="faq" aria-labelledby="discord-how">
        <h2 id="discord-how">How it works</h2>
        <details open>
          <summary>Install (10 seconds)</summary>
          <p>
            {installSteps} Choose <strong>Add to My Apps</strong> (works in every server and DM, no
            admin needed) or add it to a server you manage. That's it — type <code>/memeon</code>{' '}
            anywhere.
          </p>
        </details>
        <details>
          <summary>Connect your MemeOn account</summary>
          <p>
            Run <code>/memeon-connect</code> in Discord and follow the private link — one Masky
            login and your searches put your own binder and your friends' memes above the public
            pool. Your Discord identity is never shown to other MemeOn users.
          </p>
        </details>
        <details>
          <summary>Why every drop matters</summary>
          <p>
            Cards posted through <code>/memeon</code> use the meme's unique share URL — each post
            (and each unfurl) ticks the reshare counter that drives the Paper → ✨Shiny✨ tier
            ladder. Sharing is literally how a card levels up.
          </p>
        </details>
      </section>

      <section className="faq">
        <details>
          <summary>Brand assets</summary>
          <p>The MemeOn brain — grab it for bots, servers, or wherever you rep the market.</p>
          <p className="faq-actions">
            <img
              src="/brand/memeon-logo-circle-64.png"
              srcSet="/brand/memeon-logo-circle-64.png 1x, /brand/memeon-logo-circle-256.png 2x"
              alt="MemeOn brain logo"
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
            />
            <a className="btn" href="/brand/memeon-logo-1024.png" download="memeon-logo-1024.png">
              ⬇ Full size (1024px · 1.4 MB)
            </a>
            <a
              className="btn"
              href="/brand/memeon-logo-circle-256.png"
              download="memeon-logo-256.png"
            >
              ⬇ Optimized (256px, round)
            </a>
          </p>
        </details>
      </section>
    </main>
  )
}
