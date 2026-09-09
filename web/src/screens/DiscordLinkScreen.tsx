import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'

/** Discord connect ritual as a function of its model. Every engine state is one set of args. */
export function DiscordLinkScreen({
  err,
  showWorking,
  showDone,
  showError,
}: DiscordLinkScreenModel) {
  return (
    <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
      {showWorking && (
        <>
          <span className="spin" />
          <p style={{ color: 'var(--text-dim)' }}>Connecting your Discord…</p>
        </>
      )}
      {showDone && (
        <>
          <h2>🎮 Connected!</h2>
          <p style={{ color: 'var(--text-dim)' }}>
            Head back to Discord — <code>/memeon</code> now ranks your binder 💼 and friends' memes
            🤝 first.
          </p>
        </>
      )}
      {showError && <p className="notice error">{err}</p>}
    </main>
  )
}
