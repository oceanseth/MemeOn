import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { Button, buttonClasses } from '../atoms/Button'
import { Checkbox } from '../atoms/Checkbox'
import { EmptyActions, EmptyState } from '../atoms/EmptyState'
import { MemeCard, memeCardSubClasses } from '../atoms/MemeCard'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { SkeletonCard } from '../atoms/Skeleton'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { cn } from '../lib/cn'
import { SortChips } from '../molecules/SortChips'

/** Skeleton tiles hold the grid geometry while the binder loads, so nothing jumps on arrival. */
const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const

/* ── The shared binder-grid pieces ─────────────────────────────────────────────────────────────
   `ProfileScreen`'s binder tab (the Public Binder boards `HP9-0` / `I2F-0`) is the same grid, so the
   constants below are the contract WP3c mirrors: the same 230px track as the market (4-up at the
   1108 column), a 166-wide two-up under 561px, and the skip-render slot. Both screens put their
   shares count in the card's own footer lane (`MemeCard`'s `footerRight`), which is where the board
   draws it. Exported for that reason — nothing else imports them. */

/** Same `minmax(230px, 1fr)` the production `.card-grid` used; 2 × 166 + 18 = 350 at the phone margin. */
export const binderGridClasses = cn(
  'm-0 grid list-none items-start grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 p-0',
  'max-sm:grid-cols-2 max-sm:gap-[18px]',
)

/**
 * Skip-rendering box around a card. `content-visibility` must not sit on the card itself — it would
 * clip the blurred glow bloom, which the padding / negative-margin pair contains without moving the
 * grid track.
 */
export const binderCardSlotClasses = cn(
  '[content-visibility:auto] [contain-intrinsic-size:auto_360px]',
  'pointer-events-none p-[30px] [margin:-30px] [&>*]:pointer-events-auto',
  'max-sm:p-5 max-sm:[margin:-20px]',
)

/** The creator/private row under a binder card: the atom's own footer rhythm, one line lower. */
const binderCardFooterClasses = cn(memeCardSubClasses, 'mt-0.5')

/** The ownership groove: a recessed track with the braincell-gold fill the binder counts in. */
const OWNERSHIP_TRACK = 'mt-1 block h-1 overflow-hidden rounded-sm bg-surface-pressed'

/* ── The reward rail (`70L-0` › `732-0`) is deliberately NOT here ─────────────────────────────
   The board draws the rail with a raised "🎁 Claim starter pack" pill in it, and a rail with no
   actionable control is not that rail. The claim is a one-shot mutation owned by the shell:
   `useAppShellScreen` posts `/api/onboarding/claim-pack` into its own route-local `appShellMachine`
   actor and `molecules/QuestBar` opens the pack dialog off that actor's state. Neither the mutation
   nor the dialog is exported, so a binder-side pill could only re-post the same one-shot call
   against a second copy of the onboarding state — two sources of truth for one claim. Under the
   standing default (design-gap decision 8: the shell renders the QuestBar on every route) the
   binder route already shows the board's rail, actionable pill and all, painted by the shell. If
   Lou flips that decision, the rail moves here *with* its claim — see the receipt's Requests. */

/** Unbounded 27/34 — the section heading the collection sits under (`739-0`). */
const SECTION_HEADING = cn(
  'm-0 font-display text-[27px]/[34px] font-medium tracking-title text-ink',
  'max-md:text-title',
)

/** The toolbar row: heading + live count on the left, the 46px control lane on the right. */
const TOOLBAR = 'mt-7 mb-[18px] flex flex-wrap items-end justify-between gap-x-6 gap-y-3.5'

/**
 * "Show private (N)" as the board's 46px pill, still a real checkbox: the 22px well rides inside
 * the pill so the control keeps `role="checkbox"` (and its checked state) for assistive tech while
 * sitting in the toolbar's own lane. Checked presses the pill into the surface, like every other
 * "you are here" in Soft Press.
 */
const PRIVATE_PILL = cn(
  'ms-0 min-h-[46px] gap-2.5 rounded-control bg-surface-raised px-[18px] py-0 shadow-raised',
  'text-label font-semibold text-ink',
  'has-[[data-checked]]:bg-surface-pressed has-[[data-checked]]:shadow-pressed',
)

/**
 * Mint is neutral raised beside the desktop toolbar (the sidebar's Mint pill is the chrome's one
 * primary) and the phone's own full-width bubblegum action, where there is no sidebar —
 * `plan-buckets.md` › primary-action, item 2.
 */
const MINT_LINK = cn(
  buttonClasses(),
  'max-2xl:w-full max-2xl:bg-action max-2xl:text-on-action',
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

      {/* `70L-0` › `72V-0` (iPhone `7B6-0` › `7CT-0`) draws this as a raised card, not a bare row:
          1108×98 (350×98 on the phone), 20 padding, radius 26 — the app's `--radius-card` 25 under
          design-gap decision 9 — 16 gap, the 54/20 ultraviolet disc, then the name over its meta. */}
      {identity && (
        <div
          data-slot="binder-identity"
          className="mb-6 flex min-h-[98px] items-center gap-4 rounded-card bg-surface p-5 shadow-raised"
        >
          <Avatar
            name={identity.name}
            src={identity.pictureUrl}
            size="lg"
            className="size-[54px] rounded-[20px]"
          />
          <div className="min-w-0">
            <p
              data-slot="binder-identity-name"
              className="m-0 font-display text-[24px]/[30px] font-medium tracking-title text-ink"
            >
              {identity.name}
            </p>
            <p className="m-0 mt-[7px] text-small font-medium text-ink-muted tabular-nums">
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
            className="mt-1 block text-small text-ink-muted tabular-nums"
            {...statusProps}
          >
            {statusMessage}
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 max-2xl:w-full"
          role="group"
          aria-label="Sort and filter your binder"
        >
          {/* the board's own order (`739-0`): the filter, then the sort, then Mint */}
          {showPrivateToggle && (
            <Checkbox label={privateToggleLabel} className={PRIVATE_PILL} {...privateToggleProps} />
          )}
          <SortChips model={sortChips} />
          <Link className={MINT_LINK} {...createLinkProps}>
            <span className="2xl:hidden" aria-hidden="true">
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
                /* the board's own footer lane (`73V-0`): `🧠 n` left, `12/100 shares` right, one
                   row — not the market's listing pair with an ownership row stacked under it */
                footerRight={<span className="font-semibold text-ink">{card.sharesLabel}</span>}
                footer={
                  <>
                    {(card.showCreator || card.showPrivate) && (
                      <span className={binderCardFooterClasses}>
                        <span className="flex flex-wrap items-center gap-1.5 text-ink-muted">
                          {card.showCreator && <span>you minted this</span>}
                          {card.showPrivate && <Badge>🙈 private</Badge>}
                        </span>
                      </span>
                    )}
                    <span className={OWNERSHIP_TRACK} aria-hidden="true">
                      <i className="block h-full bg-warning-text" style={{ width: `${card.sharesPct}%` }} />
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
