import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'

/** Profile as a function of its model. Tabs are controlled props. */
export function ProfileScreen({
  tab,
  err,
  showErr,
  showLoading,
  profile,
  showActions,
  showJoin,
  followPrimary,
  followLabel,
  friendLabel,
  friendDisabled,
  createdCount,
  binderCount,
  memes,
  showEmpty,
  showGrid,
  onTabChange,
  onToggleFollow,
  onFriendAction,
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
        {profile.picture && (
          <img
            src={profile.picture}
            alt={profile.name}
            style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid var(--accent)', objectFit: 'cover' }}
          />
        )}
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', margin: '10px 0 4px' }}>{profile.name}</h1>
        <p style={{ margin: 0 }}>
          ⭐ {profile.followers} followers · 📚 {profile.collectionSize} memes · portfolio 🧠{' '}
          {profile.portfolioValue.toLocaleString()}
        </p>
        {showActions && (
          <div className="filter-bar" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button className={followPrimary ? 'primary' : ''} onClick={onToggleFollow}>
              {followLabel}
            </button>
            <button
              onClick={onFriendAction}
              disabled={friendDisabled}
            >
              {friendLabel}
            </button>
          </div>
        )}
        {showJoin && (
          <div className="filter-bar" style={{ justifyContent: 'center', marginTop: 16 }}>
            <Link to="/">
              <button className="primary">Join MemeOn to collect &amp; trade</button>
            </Link>
          </div>
        )}
      </section>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <button className={tab === 'created' ? 'primary' : ''} onClick={() => onTabChange('created')}>
          Created ({createdCount})
        </button>
        <button className={tab === 'binder' ? 'primary' : ''} onClick={() => onTabChange('binder')}>
          Binder ({binderCount})
        </button>
      </div>

      {showEmpty ? (
        <div className="empty">Nothing here yet.</div>
      ) : showGrid ? (
        <div className="card-grid">
          {memes.map((m) => (
            <MemeCard
              key={`${tab}-${m.id}`}
              meme={m}
              footer={
                m.shares !== undefined ? (
                  <span className="meme-sub">
                    <span>{m.shares}/100 shares</span>
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
