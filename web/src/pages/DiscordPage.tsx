import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export default function DiscordPage() {
  const [installUrl, setInstallUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch<{ configured: boolean; installUrl: string | null }>('/api/discord/config')
      .then((r) => setInstallUrl(r.installUrl))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 24 }}>
        <h1>
          MemeOn <span className="grad">for Discord</span>
        </h1>
        <p>
          The GIF picker, but it pays. Type <code>/memeon</code> in any chat, search with live
          results — your binder 💼 and friends' memes 🤝 rank first — and drop a card. Every card
          posted is a share link: it unfurls with its current foil tier frame and{' '}
          <strong>counts as a reshare</strong>, pushing the meme up the tiers.
        </p>
        {loaded &&
          (installUrl ? (
            <a href={installUrl} target="_blank" rel="noreferrer">
              <button className="primary login-btn">🧠 Add MemeOn to Discord</button>
            </a>
          ) : (
            <p className="notice ok">Almost live — the Discord app is being registered. Check back soon!</p>
          ))}
      </section>

      <div className="panel" style={{ maxWidth: 780, margin: '0 auto 28px', textAlign: 'center' }}>
        <img
          src="/brand/memeon-logo-circle-256.png"
          alt="MemeOn brain logo"
          style={{ width: 140, height: 140 }}
        />
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: '10px 0 14px' }}>
          The MemeOn brain — grab it for bots, servers, or wherever you rep the market.
        </p>
        <div className="filter-bar" style={{ justifyContent: 'center' }}>
          <a href="/brand/memeon-logo-1024.png" download="memeon-logo-1024.png">
            <button className="primary">⬇ Full size (1024px)</button>
          </a>
          <a href="/brand/memeon-logo-circle-256.png" download="memeon-logo-256.png">
            <button>⬇ Optimized (256px, round)</button>
          </a>
        </div>
      </div>

      <div className="faq">
        <details open>
          <summary>Install (10 seconds)</summary>
          <p>
            Click the button above → choose <strong>Add to My Apps</strong> (works in every server
            and DM, no admin needed) or add it to a server you manage. That's it — type{' '}
            <code>/memeon</code> anywhere.
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
            ladder. Sharing literally pumps your bags.
          </p>
        </details>
      </div>
    </main>
  )
}
