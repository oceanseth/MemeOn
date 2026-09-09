import { MemeCard } from '../atoms/MemeCard'
import type { InviteScreenModel } from '../hooks/useInviteScreen'

/** Invite landing as a function of its model. Every engine state is one set of args. */
export function InviteScreen({
  err,
  isSelf,
  showFatalError,
  showSpinner,
  showAcceptError,
  showHighlights,
  acceptLabel,
  inviter,
  cards,
  acceptButtonProps,
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

  if (!inviter) return null

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 24 }}>
        {inviter.hasPicture && (
          <img
            {...inviter.imageProps}
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
          {inviter.statsLabel}
        </p>
        <p>
          MemeOn turns memes into trading cards. Mint them, watch them climb foil rarity tiers as
          their share links spread, and invest in your friends' bangers before they go ✨Shiny✨.
        </p>
        {isSelf ? (
          <p className="notice ok">This is your own invite link — send it to a friend!</p>
        ) : (
          <button className="primary login-btn" {...acceptButtonProps}>
            {acceptLabel}
          </button>
        )}
        {showAcceptError && <p className="notice error">{err}</p>}
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          {inviter.acceptanceNote}
        </p>
      </section>

      {showHighlights && (
        <>
          <h2 className="section-title" style={{ marginTop: 10 }}>
            {inviter.name}'s binder highlights
          </h2>
          <div className="card-grid">
            {cards.map((card) => (
              <MemeCard key={card.id} model={card.memeCard} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
