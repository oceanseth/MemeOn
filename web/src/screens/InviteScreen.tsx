import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { InviteScreenModel } from '../hooks/useInviteScreen'

/** Invite landing as a function of its model. Every engine state is one set of args. */
export function InviteScreen({
  err,
  showFatalError,
  showSpinner,
  showAcceptError,
  showAcceptSuccess,
  showAcceptSpinner,
  showHighlights,
  loadingLabel,
  acceptErrorMessage,
  acceptSuccessMessage,
  highlightsTitle,
  acceptLabel,
  fatalActions,
  selfActions,
  inviter,
  cards,
  acceptButtonProps,
}: InviteScreenModel) {
  if (showFatalError)
    return (
      <main className="container" id="main" tabIndex={-1}>
        <section className="hero invite-hero">
          <h1>{fatalActions.title}</h1>
          <div className="notice error" role="alert">
            {err}
          </div>
          <div className="empty-actions">
            <button className="primary login-btn" {...fatalActions.joinButtonProps}>
              {fatalActions.joinLabel}
            </button>
            <Link to={fatalActions.homeHref}>{fatalActions.homeLabel}</Link>
          </div>
        </section>
      </main>
    )

  if (showSpinner)
    return (
      <main className="container" id="main" tabIndex={-1}>
        <div className="loading-state" role="status" aria-busy="true">
          <span className="spin" aria-hidden="true" />
          {loadingLabel}
        </div>
      </main>
    )

  if (!inviter) return null

  return (
    <main className="container" id="main" tabIndex={-1}>
      <section className="hero invite-hero">
        {inviter.avatar.kind === 'image' ? (
          <img className="invite-avatar" {...inviter.avatar.imageProps} />
        ) : (
          <div className="invite-avatar invite-avatar-monogram" aria-hidden="true">
            {inviter.avatar.initial}
          </div>
        )}
        <h1>
          <span className="grad">{inviter.name}</span> invited you to MemeOn
        </h1>
        <ul className="invite-stats">
          {inviter.stats.map((stat) => (
            <li key={stat.id}>
              <span aria-hidden="true">{stat.emoji}</span> {stat.value} {stat.label}
            </li>
          ))}
        </ul>
        <p>
          MemeOn turns memes into trading cards. Mint them, watch them climb foil rarity tiers as
          their share links spread, and invest in your friends' bangers before they go ✨Shiny✨.
        </p>
        {selfActions ? (
          <>
            <div className="notice ok" role="status">
              {selfActions.note}
            </div>
            <div className="empty-actions">
              <button className="primary login-btn" {...selfActions.copyButtonProps}>
                {selfActions.copyLabel}
              </button>
              <Link to={selfActions.friendsHref}>{selfActions.friendsLabel}</Link>
            </div>
            <span className="sr-only" role="status">
              {selfActions.copyStatusMessage}
            </span>
          </>
        ) : showAcceptSuccess ? null : (
          // the offer retires once it is taken: the confirmation below is the whole state
          <div className="empty-actions">
            <button className="primary login-btn" {...acceptButtonProps}>
              {showAcceptSpinner && <span className="spin" aria-hidden="true" />}
              {acceptLabel}
            </button>
          </div>
        )}
        {showAcceptError && (
          <div className="notice error" role="alert">
            {acceptErrorMessage}
          </div>
        )}
        {showAcceptSuccess && (
          <div className="notice ok" role="status">
            {acceptSuccessMessage}
          </div>
        )}
        <p className="invite-note">{inviter.acceptanceNote}</p>
      </section>

      {showHighlights && (
        <>
          <h2 className="section-title invite-highlights-title">{highlightsTitle}</h2>
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
