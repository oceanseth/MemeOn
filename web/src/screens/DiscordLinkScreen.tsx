import { Link } from 'react-router-dom'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'

/** Discord connect ritual as a function of its model. Every engine state is one set of args. */
export function DiscordLinkScreen({
  heading,
  showConfirm,
  showBusy,
  showDone,
  showError,
  busyMessage,
  errTitle,
  errBody,
  canRetry,
  onConfirm,
  onRetry,
}: DiscordLinkScreenModel) {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="link-status">
        {/* one region for the whole ritual, mounted in every phase, so the swap is announced */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {heading && <h1>{heading}</h1>}
          {showConfirm && (
            <>
              <p className="muted">
                Your Discord name is never shown to other MemeOn users — <code>/memeon</code> just
                ranks your own binder 💼 and your friends' memes 🤝 first.
              </p>
              <div className="empty-actions">
                <button className="primary" onClick={onConfirm}>
                  Connect Discord
                </button>
                <Link className="btn" to="/discord">
                  Not now
                </Link>
              </div>
            </>
          )}
          {showBusy && (
            <>
              <span className="spin" aria-hidden="true" />
              <p className="muted">{busyMessage}</p>
            </>
          )}
          {showDone && (
            <>
              <p className="muted">
                Head back to Discord — <code>/memeon</code> now ranks your binder 💼 and friends'
                memes 🤝 first.
              </p>
              <div className="empty-actions">
                <Link className="btn" to="/discord">
                  Back to MemeOn
                </Link>
              </div>
            </>
          )}
        </div>
        {showError && (
          <>
            <h1>{errTitle}</h1>
            <p className="notice error" role="alert">
              {errBody}
            </p>
            <div className="empty-actions">
              {canRetry && (
                <button className="primary" onClick={onRetry}>
                  Try again
                </button>
              )}
              <Link className="btn" to="/discord">
                Back to MemeOn
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
