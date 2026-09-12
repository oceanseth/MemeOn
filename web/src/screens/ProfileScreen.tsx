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

/* The identity card: one raised surface under the page title, the hero avatar inline with the
   binder line and the relationship controls pushed to its trailing edge (`69R-0` › `BPY-0`:
   radius 28, padding 20, gap 14). The board draws that frame **138px** tall — 12 more than the
   86px avatar plus its padding pays for — so the card carries the height as a floor above the
   phone cut and lets a wrapped identity grow past it. */
const IDENTITY_CARD = cn(
  'mb-5 flex flex-wrap items-center gap-y-4 gap-x-3.5 rounded-[28px] bg-surface p-5 shadow-raised',
  'max-sm:rounded-nav',
)

/* 86/32 inside the app (`BPZ-0`), 60/22 on the public boards (`K62-0`/`HPQ-0`), one step down on a
   phone where the card only has 310px of row (`C12-0` draws 74). */
const HERO_AVATAR = 'size-[86px] rounded-[32px] max-sm:size-[74px] max-sm:rounded-[28px]'
const HERO_AVATAR_PUBLIC = 'size-[60px] rounded-[22px]'

const IDENTITY_LINE =
  'm-0 truncate font-display text-title font-medium tracking-title text-ink [overflow-wrap:anywhere]'

const META_LINE = 'm-0 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-label font-semibold text-ink-muted'

/** The friend state is a caption, not a pill: a standing fact never competes with the actions. */
const FRIEND_CAPTION = 'm-0 mt-1.5 text-label font-semibold text-ink-muted'

const ACTIONS = 'flex flex-wrap items-center gap-3 max-sm:w-full max-sm:[&>*]:flex-1'

/** The two pressed tabs (`BQ9-0`): 46px pills, 14 apart, "you are here" carried by aria-pressed. */
const TABS = 'mb-[18px] flex flex-wrap items-center gap-3.5 max-sm:[&>*]:flex-1'

/* The Public Binder board does not box its identity. `HP9-0` › `HPP-0` (top 104, height 110) is one
   16px-gap row: the 60px avatar inline beside the 44/55 H1 with the meta line under it — and the
   introduction `HPM-0` (top 224) sits *below that whole row*, at the page's own left edge rather
   than indented past the avatar. The iPhone board (`I2Z-0`, `alignItems: start`) tops the avatar
   out against the title's first line instead of centring it against two wrapped ones. */
const BINDER_HERO = 'flex items-center gap-4 max-sm:items-start'

/** 10px from the identity row to the intro, 40px on to the tabs (`HPM-0` 224 → `HPW-0` 284). */
const BINDER_HERO_STACK = 'mt-5 mb-10 flex flex-col gap-2.5'

/** `HPN-0`: the board's introduction is label at regular weight, not the intro PageHead subtitle. */
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
      <PageContainer as="main" id="main" tabIndex={-1} role="status" aria-live="polite">
        <span className="sr-only">{loadingLabel}</span>
        <div className={cn(IDENTITY_CARD, 'mt-5 sm:min-h-[138px]')} aria-hidden="true">
          <Skeleton className="size-[86px] rounded-[32px]" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="mb-2.5 h-[30px] w-[220px] max-w-full" />
            <SkeletonBlock className="w-[260px] max-w-full" />
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

  /* The relationship cluster travels with the identity: pinned to the trailing edge of the card on
     the app and public-profile boards, on its own line under the intro on the Public Binder hero,
     which is a bare row with no card to pin anything to. */
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

      {/* the Public Binder board keeps its identity clean and pairs share with the join CTA at the
          foot of the page (`HSQ-0`); the Public Profile board pins both to the identity (`K61-0`) */}
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
              size="lg"
              className={HERO_AVATAR_PUBLIC}
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
            className={cn(IDENTITY_CARD, !publicView && 'sm:min-h-[138px]')}
            data-slot="profile-identity"
          >
            <Avatar
              name={profile.name}
              src={profile.avatarSrc}
              size="lg"
              className={publicView ? HERO_AVATAR_PUBLIC : HERO_AVATAR}
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
                  /* the binder's lane, on the binder's grid (`73V-0`): one footer row, shares right */
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
