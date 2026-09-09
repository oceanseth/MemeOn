import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'

const SKELETON_CARDS = ['a', 'b', 'c', 'd']

/** Profile as a function of its model. Tabs, relationship state and copy are controlled props. */
export function ProfileScreen({
  showErr,
  errTitle,
  errBody,
  retryLabel,
  retryButtonProps,
  errorLinkLabel,
  errorLinkProps,
  showLoading,
  loadingLabel,
  profile,
  showActions,
  followButtonClassName,
  followGlyph,
  followText,
  followButtonProps,
  showFriendButton,
  friendGlyph,
  friendText,
  friendButtonProps,
  showFriendChip,
  friendChipGlyph,
  friendChipText,
  showActionErr,
  actionErr,
  showJoin,
  joinLabel,
  joinLinkProps,
  createdCount,
  binderCount,
  cards,
  showEmpty,
  emptyTitle,
  emptyBody,
  showEmptyLink,
  emptyLinkLabel,
  emptyLinkProps,
  showGrid,
  createdTabClassName,
  binderTabClassName,
  createdTabButtonProps,
  binderTabButtonProps,
  gridProps,
}: ProfileScreenModel) {
  if (showErr)
    return (
      <main className="container" id="main" tabIndex={-1}>
        <div className="empty error" role="alert">
          <h2>{errTitle}</h2>
          <p>{errBody}</p>
          <div className="empty-actions">
            <button className="primary" {...retryButtonProps}>
              {retryLabel}
            </button>
            <Link className="btn" {...errorLinkProps}>
              {errorLinkLabel}
            </Link>
          </div>
        </div>
      </main>
    )
  if (showLoading || !profile)
    return (
      <main className="container" id="main" tabIndex={-1} role="status" aria-live="polite">
        <span className="sr-only">{loadingLabel}</span>
        <div className="page-head profile-hero" aria-hidden="true">
          <div className="profile-identity">
            <div className="skeleton profile-avatar" />
            <div className="profile-identity-copy">
              <div className="skeleton skeleton-block profile-skeleton-name" />
              <div className="skeleton skeleton-block profile-skeleton-stats" />
            </div>
          </div>
        </div>
        <div className="card-grid" aria-hidden="true">
          {SKELETON_CARDS.map((key) => (
            <div key={key} className="skeleton skeleton-card profile-skeleton-card" />
          ))}
        </div>
      </main>
    )

  return (
    <main className="container" id="main" tabIndex={-1}>
      <header className="page-head profile-hero">
        <div className="profile-identity">
          {profile.avatar.kind === 'image' ? (
            <img className="profile-avatar" {...profile.avatar.imageProps} />
          ) : (
            <span className="profile-avatar avatar-fallback" aria-hidden="true">
              {profile.avatar.initial}
            </span>
          )}
          <div className="profile-identity-copy">
            <h1>{profile.name}</h1>
            <ul className="profile-stats">
              {profile.stats.map((stat) => (
                <li key={stat.id}>
                  <span aria-hidden="true">{stat.glyph}</span> {stat.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showActions && (
          <div className="filter-bar" role="group" aria-label="Profile actions">
            <button className={followButtonClassName} {...followButtonProps}>
              <span aria-hidden="true">{followGlyph}</span> {followText}
            </button>
            {showFriendButton && (
              <button {...friendButtonProps}>
                <span aria-hidden="true">{friendGlyph}</span> {friendText}
              </button>
            )}
            {showFriendChip && (
              <span className="badge state">
                <span aria-hidden="true">{friendChipGlyph}</span> {friendChipText}
              </span>
            )}
          </div>
        )}

        {showJoin && (
          <div className="filter-bar">
            <Link className="btn primary login-btn" {...joinLinkProps}>
              {joinLabel}
            </Link>
          </div>
        )}
      </header>

      {showActionErr && (
        <p className="notice error" role="alert">
          {actionErr}
        </p>
      )}

      <div className="filter-bar profile-tabs" role="group" aria-label="Profile section">
        <button className={createdTabClassName} {...createdTabButtonProps}>
          Created ({createdCount})
        </button>
        <button className={binderTabClassName} {...binderTabButtonProps}>
          Binder ({binderCount})
        </button>
      </div>

      {showEmpty ? (
        <div className="empty" role="status" {...gridProps}>
          <h2>{emptyTitle}</h2>
          <p>{emptyBody}</p>
          {showEmptyLink && (
            <div className="empty-actions">
              <Link className="btn primary" {...emptyLinkProps}>
                {emptyLinkLabel}
              </Link>
            </div>
          )}
        </div>
      ) : showGrid ? (
        <div className="card-grid" role="group" {...gridProps}>
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
