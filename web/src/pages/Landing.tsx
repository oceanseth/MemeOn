import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { beginMaskyLogin } from '../lib/auth'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { tierClasses } from '../components/MemeCard'
import { TIERS, type Tier } from '../../../shared/tiers'

interface FrameInfo {
  key: string
  name: string
  url: string
}

export default function Landing() {
  const { user, loading } = useAuth()
  const [frames, setFrames] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ tiers: Tier[]; frames: FrameInfo[] }>('/api/frames')
      .then((r) => setFrames(Object.fromEntries(r.frames.map((f) => [f.key, f.url]))))
      .catch(() => {})
  }, [])

  if (!loading && user) return <Navigate to="/marketplace" replace />

  const login = async () => {
    setBusy(true)
    setErr(null)
    try {
      await beginMaskyLogin()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'login failed')
      setBusy(false)
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>
          Memes are the new <span className="grad">trading cards</span>
        </h1>
        <p>
          Mint your memes, watch them climb the virality tiers as they get reshared, and trade
          positions with friends. Every meme gets a share link whose card frame levels up as it
          spreads.
        </p>
        <button className="primary login-btn" onClick={login} disabled={busy}>
          {busy ? 'Redirecting…' : '🎭 Log in with Masky'}
        </button>
        {err && <p className="notice error">{err}</p>}
      </section>

      <h2 className="section-title" id="tiers">
        The Virality Tiers
      </h2>
      <p className="section-sub">
        Reshares power everything. Share a meme's link anywhere — every unfurl and click counts —
        and its card physically transforms as it ascends.
      </p>
      <div className="tier-grid">
        {TIERS.map((t) => (
          <div key={t.key} className={`tier-card ${tierClasses(t.key)}`}>
            <div className="tier-card-inner">
              {frames[t.key] ? (
                <img
                  className="tier-frame-img"
                  src={frames[t.key]}
                  alt={`${t.name} frame`}
                  loading="lazy"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              ) : null}
              <span className="tier-name" style={{ color: t.color }}>
                {t.name}
              </span>
              <span className="tier-req">
                {t.rarity} · {t.minReshares.toLocaleString()}+ reshares
              </span>
              <span className="tier-hype">{t.hype}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">FAQ</h2>
      <div className="faq">
        <details open>
          <summary>WTF is MemeOn?</summary>
          <p>
            A meme trading card market. You mint memes (upload or generate them with your Masky
            credits), each one becomes a 100-share collectible card, and its rarity tier is driven
            by real reshares of its unique link.
          </p>
        </details>
        <details>
          <summary>How do tiers work?</summary>
          <p>
            Every meme has a share URL (memeon.ai/m/…). Each time that link is loaded — a friend
            clicks it, Discord unfurls it, a bot scrapes it — the reshare counter ticks up. Cross a
            threshold and the meme tiers up: Paper → Silver → Holo → Chrome → Gold → Prismatic →
            ✨Shiny✨. The link preview card (the og image) upgrades its foil frame automatically,
            so a Gold meme flexes gold wherever it's shared.
          </p>
        </details>
        <details>
          <summary>What are braincells? 🧠</summary>
          <img
            className="braincell-img"
            src="/api/brand/braincell.png"
            alt="a braincell"
            style={{ width: 72, height: 72, float: 'right', margin: '6px 0 6px 12px' }}
          />
          <p>
            Braincells are MemeOn's currency — you buy meme shares, fund trades, and flex on the
            🏆 Top Brains leaderboard with them. Everyone starts at zero (smoothbrained, sorry) and
            earns their first braincells through the onboarding quests: claim your free starter
            pack, mint your first meme, get your first reshare, make a friend, close a trade. AI
            generation is separate — that runs on your own Masky credits.
          </p>
        </details>
        <details>
          <summary>How do I invest in a meme?</summary>
          <p>
            Memes are split into 100 shares. Holders can list shares at a price in braincells 🧠;
            you can buy from the Marketplace, or propose direct trades (shares + braincells for
            shares + braincells) with friends. When your meme sells or tiers up, you get an alert.
          </p>
        </details>
        <details>
          <summary>What's Masky got to do with it?</summary>
          <p>
            Login is "Sign in with Masky" — your Masky avatar is your identity here, and meme
            generation (images and videos) runs on your own Masky credits. Your real identity
            stays protected: MemeOn only ever sees your avatar, never who's behind the mask. And
            your avatar can do more than represent you — configure an agentic harness for it on
            Masky and it runs as an agent on your behalf: auto-approving or proposing trades,
            minting new memes with AI, watching for memes catching reshare momentum, and generally
            maximizing your braincells while you sleep.
          </p>
        </details>
      </div>
    </main>
  )
}
