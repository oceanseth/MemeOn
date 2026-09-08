import { MemeCard } from '../atoms/MemeCard'
import type { InviteScreenModel } from '../hooks/useInviteScreen'

/** Invite landing as a function of its model. Every engine state is one set of args. */
export function InviteScreen({
  data,
  err,
  busy,
  isSelf,
  showFatalError,
  showSpinner,
  showAcceptError,
  showHighlights,
  acceptLabel,
  onAccept,
}: InviteScreenModel) {
  if (showFatalError)
    return (
      <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
        <p className="notice error">{err}</p>
      </main>
    )

  if (showSpinner)
    return (
      <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
        <span className="spin" />
      </main>
    )

  if (!data) return null

  const { inviter, topMemes } = data

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 24 }}>
        {inviter.picture && (
          <img
            src={inviter.picture}
            alt={inviter.name}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              border: '3px solid var(--accent)',
              objectFit: 'cover',
            }}
          />
        )}
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)' }}>
          <span className="grad">{inviter.name}</span> invited you to MemeOn
        </h1>
        <p>
          📚 {inviter.collectionSize} memes collected · 🧠 {inviter.portfolioValue.toLocaleString()}{' '}
          portfolio · ⭐ {inviter.followers} followers
        </p>
        <p>
          MemeOn turns memes into trading cards. Mint them, watch them climb foil rarity tiers as
          their share links spread, and invest in your friends' bangers before they go ✨Shiny✨.
        </p>
        {isSelf ? (
          <p className="notice ok">This is your own invite link — send it to a friend!</p>
        ) : (
          <button className="primary login-btn" onClick={onAccept} disabled={busy}>
            {acceptLabel}
          </button>
        )}
        {showAcceptError && <p className="notice error">{err}</p>}
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Joining creates your account with Masky single sign-on and instantly makes you and{' '}
          {inviter.name} friends.
        </p>
      </section>

      {showHighlights && (
        <>
          <h2 className="section-title" style={{ marginTop: 10 }}>
            {inviter.name}'s binder highlights
          </h2>
          <div className="card-grid">
            {topMemes.map((m) => (
              <MemeCard key={m.id} meme={m} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
