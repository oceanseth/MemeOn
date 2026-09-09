import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'

/** Profile as a function of its model. Tabs are controlled props. */
export function ProfileScreen({
  err,
  showErr,
  showLoading,
  profile,
  showActions,
  showJoin,
  followButtonClassName,
  followLabel,
  friendLabel,
  createdCount,
  binderCount,
  cards,
  showEmpty,
  showGrid,
  createdTabClassName,
  binderTabClassName,
  createdTabButtonProps,
  binderTabButtonProps,
  followButtonProps,
  friendButtonProps,
  joinLinkProps,
}: ProfileScreenModel) {
  if (showErr)
    return (
      <main className="container">
        <div className="empty" style={{ marginTop: 60 }}>{err}</div>
      </main>
    )
  if (showLoading || !profile)
    return (
      <main className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <span className="spin" />
      </main>
    )

  return (
    <main className="container">
      <section className="hero" style={{ paddingTop: 44, paddingBottom: 20 }}>
        {profile.hasPicture && (
          <img
            {...profile.imageProps}
            style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid var(--accent)', objectFit: 'cover' }}
          />
        )}
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', margin: '10px 0 4px' }}>{profile.name}</h1>
        <p style={{ margin: 0 }}>
          {profile.statsLabel}
        </p>
        {showActions && (
          <div className="filter-bar" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button className={followButtonClassName} {...followButtonProps}>
              {followLabel}
            </button>
            <button
              {...friendButtonProps}
            >
              {friendLabel}
            </button>
          </div>
        )}
        {showJoin && (
          <div className="filter-bar" style={{ justifyContent: 'center', marginTop: 16 }}>
            <Link {...joinLinkProps}>
              <button className="primary">Join MemeOn to collect &amp; trade</button>
            </Link>
          </div>
        )}
      </section>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <button className={createdTabClassName} {...createdTabButtonProps}>
          Created ({createdCount})
        </button>
        <button className={binderTabClassName} {...binderTabButtonProps}>
          Binder ({binderCount})
        </button>
      </div>

      {showEmpty ? (
        <div className="empty">Nothing here yet.</div>
      ) : showGrid ? (
        <div className="card-grid">
          {cards.map((card) => (
            <MemeCard
              key={card.id}
              model={card.memeCard}
              footer={
                card.sharesLabel !== null ? (
                  <span className="meme-sub">
                    <span>{card.sharesLabel}</span>
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </main>
  )
}
