import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Button, buttonClasses } from '../atoms/Button'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Skeleton, SkeletonBlock, SkeletonCard } from '../atoms/Skeleton'
import { cn } from '../lib/cn'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'
import { binderCardSlotClasses, binderGridClasses } from './BinderScreen'

const SKELETON_CARDS = ['a', 'b', 'c', 'd']

/* identity card: min height floor so wrapped content can grow past the avatar row */
const IDENTITY_CARD = cn(
  'mb-5 flex flex-wrap items-center gap-y-4 gap-x-3.5 rounded-band bg-surface p-5 shadow-raised',
  'max-sm:rounded-nav',
)

const IDENTITY_LINE =
  'm-0 truncate font-display text-title font-medium tracking-title text-ink [overflow-wrap:anywhere]'

const META_LINE = 'm-0 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-label font-semibold text-ink-muted'

/** The friend state is a caption, not a pill: a standing fact never competes with the actions. */
const FRIEND_CAPTION = 'm-0 mt-1.5 text-label font-semibold text-ink-muted'

const ACTIONS = 'flex flex-wrap items-center gap-3 max-sm:w-full max-sm:[&>*]:flex-1'

const TABS = 'mb-gutter flex flex-wrap items-center gap-3.5 max-sm:[&>*]:flex-1'

/** Public binder hero: bare row, intro below the avatar row at page edge. */
const BINDER_HERO = 'flex items-center gap-4 max-sm:items-start'
const BINDER_HERO_STACK = 'mt-5 mb-10 flex flex-col gap-2.5'
/** Binder intro is label weight, not PageHead subtitle. */
const BINDER_INTRO = 'm-0 text-label text-ink-muted'

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
  title,
  intro,
  identityLine,
  showBinderHero,
  profile,
  showActions,
  tradeLabel,
  tradeLinkProps,
  shareLabel,
  shareButtonProps,
  showSelfActions,
  settingsLabel,
  settingsLinkProps,
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
  reshareNote,
  createdCount,
  binderCount,
  cards,
  gridCountLabel,
  showMore,
  showMoreLabel,
  showMoreButtonProps,
  showEmpty,
  emptyTitle,
  emptyBody,
  showEmptyLink,
  emptyLinkLabel,
  emptyLinkProps,
  showGrid,
  createdTabButtonProps,
  binderTabButtonProps,
  gridProps,
}: ProfileScreenModel) {
  if (showErr)
    return (
      <PageContainer as="main" id="main" tabIndex={-1}>
        <EmptyState tone="error">
          <h2>{errTitle}</h2>
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
      <PageContainer as="main" id="main" tabIndex={-1}>
        <div role="status" aria-live="polite" className="sr-only">{loadingLabel}</div>
        <div className={cn(IDENTITY_CARD, 'mt-5 sm:min-h-34.5')} aria-hidden="true">
          <Skeleton className="size-avatar-hero rounded-avatar-hero" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="mb-2.5 h-7.5 w-55 max-w-full" />
            <SkeletonBlock className="w-65 max-w-full" />
          </div>
        </div>
        <ul className={binderGridClasses} aria-hidden="true">
          {SKELETON_CARDS.map((key) => (
            <li key={key}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      </PageContainer>
    )

  const publicView = showJoin

  const metaLine = (
    <p className={META_LINE}>
      {profile.stats.map((stat, index) => (
        <span key={stat.id} className="inline-flex items-center gap-1.5">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          {stat.glyph ? <span aria-hidden="true">{stat.glyph}</span> : null}
          {stat.text}
        </span>
      ))}
    </p>
  )

  const friendCaption = showFriendChip ? (
    <p className={FRIEND_CAPTION} data-slot="friend-state">
      <span aria-hidden="true">{friendChipGlyph}</span> {friendChipText}
    </p>
  ) : null

  /* relationship actions: trailing edge on card views, own line on public binder hero */
  const identityActions = (
    <>
      {showActions && (
        <div className={ACTIONS} role="group" aria-label="Profile actions">
          {showFriendButton && (
            <Button variant="primary" {...friendButtonProps}>
              <span aria-hidden="true">{friendGlyph}</span> {friendText}
            </Button>
          )}
          <Button variant={followButtonVariant} {...followButtonProps}>
            <span aria-hidden="true">{followGlyph}</span> {followText}
          </Button>
          <Link className={buttonClasses()} {...tradeLinkProps}>
            <span aria-hidden="true">🔁</span> {tradeLabel}
          </Link>
        </div>
      )}

      {showSelfActions && (
        <div className={ACTIONS} role="group" aria-label="Profile actions">
          <Button {...shareButtonProps}>{shareLabel}</Button>
          <Link className={buttonClasses()} {...settingsLinkProps}>
            {settingsLabel}
          </Link>
        </div>
      )}

      {/* public binder: share + join at page foot; public profile: both on identity card */}
      {showJoin && !showBinderHero && (
        <div className={ACTIONS}>
          <Button {...shareButtonProps}>{shareLabel}</Button>
          <Link className={buttonClasses()} {...joinLinkProps}>
            Log in to add friend
          </Link>
        </div>
      )}
    </>
  )

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {showBinderHero ? (
        <div className={BINDER_HERO_STACK}>
          <header className={BINDER_HERO} data-slot="profile-identity">
            <Avatar
              name={profile.name}
              src={profile.avatarSrc}
              size="public"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <PageHead level="h1" title={title} className="m-0" />
              {metaLine}
              {friendCaption}
            </div>
          </header>
          {intro ? <p className={BINDER_INTRO}>{intro}</p> : null}
          {identityActions}
        </div>
      ) : (
        <>
          <PageHead level="h1" title={title} {...(intro ? { subtitle: intro } : {})} className="mb-3.5" />

          <header
            className={cn(IDENTITY_CARD, !publicView && 'sm:min-h-34.5')}
            data-slot="profile-identity"
          >
            <Avatar
              name={profile.name}
              src={profile.avatarSrc}
              size={publicView ? 'public' : 'hero'}
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              {identityLine ? <p className={IDENTITY_LINE}>{identityLine}</p> : null}
              {metaLine}
              {friendCaption}
            </div>
            {identityActions}
          </header>
        </>
      )}

      {showActionErr && <Notice tone="error">{actionErr}</Notice>}

      <div className={TABS} role="group" aria-label="Profile section">
        <Button {...createdTabButtonProps}>Created ({createdCount})</Button>
        <Button {...binderTabButtonProps}>Binder ({binderCount})</Button>
      </div>

      {showEmpty ? (
        <EmptyState {...gridProps}>
          <h2>{emptyTitle}</h2>
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
        <>
          <ul className={binderGridClasses} {...gridProps}>
            {cards.map((card) => (
              <li key={card.id} className={binderCardSlotClasses}>
                <MemeCard
                  model={card.memeCard}
                  /* one footer row: shares count on the right */
                  footerRight={
                    card.sharesLabel !== null ? (
                      <span className="font-semibold text-ink">{card.sharesLabel}</span>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
          {showMore && (
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <Button className="max-sm:w-full" {...showMoreButtonProps}>
                {showMoreLabel}
              </Button>
              <p className="m-0 text-micro text-ink-muted tabular-nums">{gridCountLabel}</p>
            </div>
          )}
        </>
      ) : null}

      {showJoin && (
        <div className="mt-9 flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 max-sm:w-full max-sm:[&>*]:w-full">
            {showBinderHero ? <Button {...shareButtonProps}>{shareLabel}</Button> : null}
            <Link className={cn(buttonClasses('primary'), 'max-sm:w-full')} {...joinLinkProps}>
              {joinLabel}
            </Link>
          </div>
          <p className="m-0 text-label text-ink-muted">{reshareNote}</p>
        </div>
      )}
    </PageContainer>
  )
}
