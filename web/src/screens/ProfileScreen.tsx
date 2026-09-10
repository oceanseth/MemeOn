import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { MemeCard, memeCardSubClasses } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { Skeleton, SkeletonBlock, SkeletonCard } from '../atoms/Skeleton'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'

const SKELETON_CARDS = ['a', 'b', 'c', 'd']

const actionsRow = 'flex flex-wrap items-center gap-2.5 max-md:w-full'
const cardGrid = 'grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 max-sm:grid-cols-2 max-sm:gap-3'

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
  followButtonVariant,
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
  createdTabVariant,
  binderTabVariant,
  createdTabButtonProps,
  binderTabButtonProps,
  gridProps,
}: ProfileScreenModel) {
  if (showErr)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <EmptyState error>
          <h2 className="font-bold">{errTitle}</h2>
          <p>{errBody}</p>
          <EmptyActions>
            <Button variant="primary" {...retryButtonProps}>
              {retryLabel}
            </Button>
            <Link className={buttonClasses()} {...errorLinkProps}>
              {errorLinkLabel}
            </Link>
          </EmptyActions>
        </EmptyState>
      </PageContainer>
    )
  if (showLoading || !profile)
    return (
      <PageContainer as="main" id="main" tabIndex={-1} role="status" aria-live="polite">
        <span className="sr-only">{loadingLabel}</span>
        <div className="mx-0 mt-7 mb-5 flex flex-wrap items-center gap-4" aria-hidden="true">
          <Skeleton className="size-24 rounded-full" />
          <div className="min-w-0">
            <SkeletonBlock className="mb-2.5 h-[26px] w-[180px]" />
            <SkeletonBlock className="w-[260px] max-w-full" />
          </div>
        </div>
        <div className={cardGrid} aria-hidden="true">
          {SKELETON_CARDS.map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      </PageContainer>
    )

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <header className="mx-0 mt-7 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={profile.name} src={profile.avatarSrc} size="lg" loading="lazy" />
          <div className="min-w-0">
            <h1 className="text-2xl leading-[1.15] font-bold [overflow-wrap:anywhere]">{profile.name}</h1>
            <ul className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-sm text-text-dim">
              {profile.stats.map((stat) => (
                <li key={stat.id}>
                  <span aria-hidden="true">{stat.glyph}</span> {stat.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showActions && (
          <div className={actionsRow} role="group" aria-label="Profile actions">
            <Button variant={followButtonVariant} {...followButtonProps}>
              <span aria-hidden="true">{followGlyph}</span> {followText}
            </Button>
            {showFriendButton && (
              <Button {...friendButtonProps}>
                <span aria-hidden="true">{friendGlyph}</span> {friendText}
              </Button>
            )}
            {showFriendChip && (
              <Badge state>
                <span aria-hidden="true">{friendChipGlyph}</span> {friendChipText}
              </Badge>
            )}
          </div>
        )}

        {showJoin && (
          <div className={actionsRow}>
            <Link className={buttonClasses('login')} {...joinLinkProps}>
              {joinLabel}
            </Link>
          </div>
        )}
      </header>

      {showActionErr && <Notice tone="error">{actionErr}</Notice>}

      <div className="mb-[18px] flex flex-wrap items-center gap-2.5" role="group" aria-label="Profile section">
        <Button variant={createdTabVariant} {...createdTabButtonProps}>
          Created ({createdCount})
        </Button>
        <Button variant={binderTabVariant} {...binderTabButtonProps}>
          Binder ({binderCount})
        </Button>
      </div>

      {showEmpty ? (
        <EmptyState {...gridProps}>
          <h2 className="font-bold">{emptyTitle}</h2>
          <p>{emptyBody}</p>
          {showEmptyLink && (
            <EmptyActions>
              <Link className={buttonClasses('primary')} {...emptyLinkProps}>
                {emptyLinkLabel}
              </Link>
            </EmptyActions>
          )}
        </EmptyState>
      ) : showGrid ? (
        <div className={cardGrid} role="group" {...gridProps}>
          {cards.map((card) => (
            <MemeCard
              key={card.id}
              model={card.memeCard}
              footer={
                card.sharesLabel !== null ? (
                  <span className={memeCardSubClasses}>
                    <span>{card.sharesLabel}</span>
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </PageContainer>
  )
}
