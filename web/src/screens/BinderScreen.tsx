import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { Badge } from '@/atoms/badge'
import { Button, buttonClasses } from '@/atoms/button'
import { Checkbox } from '@/atoms/checkbox'
import { EmptyActions, EmptyState } from '@/atoms/empty-state'
import { MemeCard, memeCardSubClasses } from '@/atoms/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { SkeletonCard } from '@/atoms/skeleton'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { cn } from '../lib/cn'
import { SortChips } from '@/molecules/sort-chips'

/** Skeleton tiles hold the grid geometry while the binder loads, so nothing jumps on arrival. */
const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const

/* shared binder grid — exported for ProfileScreen's binder tab */

/** Same `minmax(230px, 1fr)` the production `.card-grid` used; 2 × 166 + 18 = 350 at the phone margin. */
export const binderGridClasses = cn(
  'm-0 grid list-none items-start grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 p-0',
  'max-sm:grid-cols-2 max-sm:gap-gutter',
)

/**
 * Skip-rendering box around a card. `content-visibility` must not sit on the card itself — it would
 * clip the blurred glow bloom, which the padding / negative-margin pair contains without moving the
 * grid track.
 */
export const binderCardSlotClasses = cn(
  'skip-render',
  'pointer-events-none p-bloom -m-bloom *:pointer-events-auto',
  'max-sm:p-page-x max-sm:-m-page-x',
)

/** The creator/private row under a binder card: the atom's own footer rhythm, one line lower. */
const binderCardFooterClasses = cn(memeCardSubClasses, 'mt-0.5')

/** The ownership groove: a recessed track with the braincell-gold fill the binder counts in. */
const OWNERSHIP_TRACK = 'mt-1 block h-track overflow-hidden rounded-full bg-muted'

/* reward rail lives in AppShell QuestBar — claim is a one-shot shell mutation, not duplicated here */

const SECTION_HEADING = 'm-0 font-display text-3xl font-normal text-foreground'

/** The toolbar row: heading + live count on the left, the 46px control lane on the right. */
const TOOLBAR = 'mt-7 mb-gutter flex flex-wrap items-end justify-between gap-x-6 gap-y-3.5'

/** Private toggle as a real checkbox inside a pill — checked state presses the pill. */
const PRIVATE_PILL = cn(
  'ms-0 min-h-control gap-2.5 rounded-lg material-raised px-4.5 py-0',
  'text-base font-semibold text-foreground',
  'has-data-checked:material-pressed',
)

/** Toolbar Mint: bubblegum on phone, neutral on desktop (sidebar owns primary). */
const MINT_LINK = cn(
  buttonClasses(),
  'max-xl:w-full max-xl:bg-primary max-xl:text-primary-foreground',
)

/** Own binder as a function of its model. Every engine state is one set of args. */
export function BinderScreen({
  intro,
  identity,
  statusProps,
  statusMessage,
  collectionHeading,
  showPrivateToggle,
  privateToggleLabel,
  privateToggleProps,
  sortChips,
  createLinkProps,
  createLabel,
  cards,
  showMore,
  showLoading,
  showEmpty,
  emptyMessage,
  emptyAction,
  showError,
  errorTitle,
  errorMessage,
  retryProps,
  showGrid,
}: BinderScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead title="My Binder" subtitle={intro} />

      {/* identity card — raised surface, not a bare row */}
      {identity && (
        <div
          data-slot="binder-identity"
          className="mb-6 flex min-h-24.5 items-center gap-4 rounded-lg material-card p-5"
        >
          <Avatar
            name={identity.name}
            src={identity.pictureUrl}
            size="lg"
            className="size-14 rounded-lg"
          />
          <div className="min-w-0">
            <p
              data-slot="binder-identity-name"
              className="m-0 font-display text-3xl font-normal text-foreground"
            >
              {identity.name}
            </p>
            <p className="m-0 mt-2 text-sm font-medium text-muted-foreground tabular-nums">
              {identity.statsLabel}
            </p>
          </div>
        </div>
      )}

      <div data-slot="binder-toolbar" className={TOOLBAR}>
        <div className="min-w-0">
          <h3 className={SECTION_HEADING}>{collectionHeading}</h3>
          {/* mounted in every state, text swapped: a live region inserted with its content is missed */}
          <span
            className="mt-1 block text-sm text-muted-foreground tabular-nums"
            {...statusProps}
          >
            {statusMessage}
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 max-xl:w-full"
          role="group"
          aria-label="Sort and filter your binder"
        >
          {/* toolbar order: private filter → sort → Mint */}
          {showPrivateToggle && (
            <Checkbox label={privateToggleLabel} className={PRIVATE_PILL} {...privateToggleProps} />
          )}
          <SortChips model={sortChips} />
          <Link className={MINT_LINK} {...createLinkProps}>
            <span className="xl:hidden" aria-hidden="true">
              ＋
            </span>
            {createLabel}
          </Link>
        </div>
      </div>

      {showLoading ? (
        <ul className={binderGridClasses} aria-hidden="true">
          {SKELETON_KEYS.map((key) => (
            <li key={key}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : showError ? (
        <EmptyState error>
          <p>
            <strong>{errorTitle}</strong>
          </p>
          <p>{errorMessage}</p>
          <EmptyActions>
            <Button variant="primary" {...retryProps}>
              Try again
            </Button>
          </EmptyActions>
        </EmptyState>
      ) : showEmpty ? (
        // the persistent status label above is the one live region for this screen
        <EmptyState role="none">
          <p>{emptyMessage}</p>
          {emptyAction && (
            <EmptyActions>
              {emptyAction.kind === 'create' ? (
                <Link className={buttonClasses('primary')} {...emptyAction.linkProps}>
                  {emptyAction.label}
                </Link>
              ) : (
                <Button variant="primary" onClick={emptyAction.onClick}>
                  {emptyAction.label}
                </Button>
              )}
            </EmptyActions>
          )}
        </EmptyState>
      ) : showGrid ? (
        <ul className={binderGridClasses}>
          {cards.map((card) => (
            <li key={card.id} className={binderCardSlotClasses} aria-label={card.ariaLabel}>
              <MemeCard
                model={card.memeCard}
                /* one footer row: shares count on the right */
                footerRight={<span className="font-semibold text-foreground">{card.sharesLabel}</span>}
                footer={
                  <>
                    {(card.showCreator || card.showPrivate) && (
                      <span className={binderCardFooterClasses}>
                        <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                          {card.showCreator && <span>you minted this</span>}
                          {card.showPrivate && <Badge>🙈 private</Badge>}
                        </span>
                      </span>
                    )}
                    <span className={OWNERSHIP_TRACK} aria-hidden="true">
                      <i className="block h-full w-(--fill) bg-warning-foreground" style={{ '--fill': `${card.sharesPct}%` } as CSSProperties} />
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      ) : null}

      {showMore && (
        <div className="mt-7 flex justify-center">
          <Button onClick={showMore.onClick} className="max-sm:w-full">
            {showMore.label}
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
