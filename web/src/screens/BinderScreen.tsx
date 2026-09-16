import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { Badge } from '@/atoms/badge'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { Checkbox } from '@/atoms/checkbox'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '@/atoms/empty'
import { Heading } from '@/atoms/heading'
import { MemeCard } from '@/atoms/meme-card'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Progress } from '@/atoms/progress'
import { SkeletonCard } from '@/atoms/skeleton'
import { Toolbar } from '@/atoms/toolbar'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { cn } from '../lib/cn'
import { SortChips } from '@/molecules/sort-chips'

/** Skeleton tiles hold the grid geometry while the binder loads, so nothing jumps on arrival. */
const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const

/* shared binder grid — exported for ProfileScreen's binder tab */

/** Same `minmax(230px, 1fr)` the production `.card-grid` used; 2 × 166 + 18 = 350 at the phone margin.
 *  No `items-start`: every slot takes its row, so every card in the row is one size. */
export const binderGridClasses = cn(
  'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 p-0',
  'max-sm:grid-cols-2 max-sm:gap-4.5',
)

/**
 * Skip-rendering box around a card. `content-visibility` must not sit on the card itself — it would
 * clip the blurred glow bloom, which the padding / negative-margin pair contains without moving the
 * grid track. A one-cell grid, so the card stretches to the slot as the slot does to its row.
 */
export const binderCardSlotClasses = cn(
  'skip-render grid',
  'pointer-events-none p-7.5 -m-7.5 *:pointer-events-auto',
  'max-sm:p-5 max-sm:-m-5',
)

/** The creator/private row under a binder card: the atom's own footer rhythm, one line lower. It is
 *  always there, at the badge's 24px, so a card that has nothing to say here is still the same
 *  height as one that does — a grid's rows must match across rows, not only within one. */
const binderCardFooterClasses = cn(
  'mt-0.5 flex min-h-6 items-start justify-between gap-2 text-xs font-medium text-foreground tabular-nums',
  '@max-card-narrow:flex-wrap @max-card-narrow:gap-y-0.5',
)

/* reward rail lives in AppShell QuestBar — claim is a one-shot shell mutation, not duplicated here */

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
        <Card
          size="sm"
          data-slot="binder-identity"
          className="mb-6 flex min-h-24.5 items-center gap-4"
        >
          <Avatar name={identity.name} src={identity.pictureUrl} size="lg" />
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
        </Card>
      )}

      <Toolbar align="between" data-slot="binder-toolbar" className="mt-7 mb-4.5 items-end">
        <div className="min-w-0">
          <Heading as="h3">{collectionHeading}</Heading>
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
            <Checkbox label={privateToggleLabel} variant="pill" {...privateToggleProps} />
          )}
          <SortChips model={sortChips} />
          {/* Mint is bubblegum under the shell cut and neutral once the header owns primary */}
          <Link className={cn(buttonVariants({ variant: 'mint' }), 'max-xl:w-full')} {...createLinkProps}>
            <span className="xl:hidden" aria-hidden="true">
              ＋
            </span>
            {createLabel}
          </Link>
        </div>
      </Toolbar>

      {showLoading ? (
        <ul className={binderGridClasses} aria-hidden="true">
          {SKELETON_KEYS.map((key) => (
            <li key={key}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : showError ? (
        <Empty variant="error">
          <EmptyHeader>
            <EmptyDescription>
              <strong>{errorTitle}</strong>
            </EmptyDescription>
            <EmptyDescription>{errorMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="primary" {...retryProps}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : showEmpty ? (
        // the persistent status label above is the one live region for this screen
        <Empty role="none">
          <EmptyDescription>{emptyMessage}</EmptyDescription>
          {emptyAction && (
            <EmptyContent>
              {emptyAction.kind === 'create' ? (
                <Link className={buttonVariants({ variant: 'primary' })} {...emptyAction.linkProps}>
                  {emptyAction.label}
                </Link>
              ) : (
                <Button variant="primary" onClick={emptyAction.onClick}>
                  {emptyAction.label}
                </Button>
              )}
            </EmptyContent>
          )}
        </Empty>
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
                    <span data-slot="binder-card-note" className={binderCardFooterClasses}>
                      <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                        {card.showCreator && <span>you minted this</span>}
                        {card.showPrivate && <Badge>🙈 private</Badge>}
                      </span>
                    </span>
                    {/* the ownership groove: how much of this meme the binder holds. `mt-auto` pins it
                       to the card's bottom edge, so whatever slack a stretched row leaves sits above
                       the meter rather than under it. */}
                    <div data-slot="binder-meter" className="mt-auto pt-1">
                      <Progress value={card.sharesPct} variant="braincell" aria-hidden="true" />
                    </div>
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
