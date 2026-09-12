import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { MemeCard } from '../atoms/MemeCard'
import { FilterBar } from '../atoms/PageHead'
import { cn } from '../lib/cn'
import { FOCUS_RING as FOCUS } from '../lib/focus'
import type { QuestBarModel } from '../lib/questBarModel'
import { DialogFrame } from './DialogFrame'

/** One path, changed once when the asset lands under public/brand/. */
const BRAINCELL_SRC = '/api/brand/braincell.png'

/** `inline-block` is load-bearing in the dialog heading: preflight would drop the coin onto its own line. */
const BRAINCELL_IMG = 'inline-block h-[26px] w-[26px] rounded-full object-cover align-middle'

/**
 * The reward rail as both boards draw it (`70L-0` › `732-0` 1108×92, iPhone `7B6-0` › `7D0-0`
 * 350×179): a pressed well, radius 24, 20/24 padding (18 on the phone), sitting in the content
 * column's 20px gutter so it lines up with the page. The quests are one lane on the left, the claim
 * on the right; below the shell breakpoint the two stack. The rows inside are the raised things.
 */
const RAIL = cn(
  'mx-5 mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-nav bg-surface-pressed p-[18px] shadow-pressed',
  '2xl:mt-2 2xl:flex-nowrap 2xl:px-6 2xl:py-5',
)

/** Unbounded card-title; phone steps to card-title-phone. */
const TITLE = cn(
  'inline-flex items-center gap-[7px] whitespace-nowrap',
  'font-display text-card-title font-medium tracking-card-title text-ink',
  'max-2xl:text-card-title-phone',
)

/** The quest lane: 24 apart in one row at 1440 (`LH4-0`), 8 apart wrapped to three at 390 (`LIR-0`). */
const CHIPS = 'flex flex-wrap items-center gap-x-6 gap-y-2 max-2xl:gap-x-2'

/** Onest 15/19 500 ink-muted (14/18 on the phone); a linked chip darkens on hover. */
const CHIP = cn(
  'inline-flex items-center gap-1.5 text-label font-medium whitespace-nowrap text-ink-muted',
  'max-2xl:text-small',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'group-hover:text-ink',
)

const CHIP_LINK = cn(
  'no-underline',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
  FOCUS,
)

/** Dismiss is text-weight so the claim pill stays the only loud control in the rail. */
const TEXT_BUTTON = cn(
  'inline-flex min-h-8 shrink-0 cursor-pointer items-center rounded-chip border-0 bg-transparent px-2 py-1',
  'text-small font-medium text-ink-muted',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:text-ink',
  'pointer-coarse:min-h-11',
  FOCUS,
)

/**
 * The claim pill as both boards draw it (`736-0`, `7D3-0`): a neutral raised pill, 46 tall at every
 * width, radius 23, 18 inline padding, 9 gap. The sidebar's Mint pill is the chrome's one primary,
 * so this one is not. It keeps the legacy `button[aria-busy='true']` treatment — full opacity and a
 * progress cursor, no spinner: in flight is not unavailable, and the label already says "Opening…".
 */
const CLAIM_BUTTON = cn(
  'inline-flex h-[46px] shrink-0 cursor-pointer items-center justify-center gap-[9px] whitespace-nowrap rounded-control px-[18px]',
  'border-0 bg-surface-raised text-label font-semibold text-ink shadow-raised',
  '[transition:transform_var(--dur-fast)_ease] motion-reduce:transition-none',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):hover]:-translate-y-px',
  'motion-reduce:[&:not(:disabled):hover]:translate-y-0!',
  'pointer-coarse:min-h-11',
  FOCUS,
)

/** The card grid with the starter pack's tighter tracks; under 561px only the gap tightens. */
const PACK_GRID = 'm-0 grid list-none items-start grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5 p-0 max-sm:gap-3'

/**
 * Onboarding quest rail. Parent owns steps, pack dialog, and claim.
 * Every quest is listed inline, as both boards draw it; the parent owns dismissed.
 */
export function QuestBar({ model }: { model: QuestBarModel }) {
  if (!model.visible) return null

  const claim = model.chips.find((chip) => chip.kind === 'claim')
  const steps = model.chips.filter((chip) => chip.kind === 'step')

  return (
    <>
      {model.showSteps && (
        <div className={RAIL} data-slot="questbar">
          <div className="flex min-w-0 flex-col gap-2.5 max-2xl:w-full 2xl:flex-1" data-slot="questbar-head">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={TITLE} data-slot="questbar-title">
                <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} />{' '}
                Earn your braincells ·{' '}
                <span data-slot="questbar-count">{model.completionLabel}</span>
              </span>
              {/* the quiet dismiss closes the quest lane, so it ends that lane's own line — which
                  puts it beside the claim pill at 900+ and above it on the phone */}
              <button
                type="button"
                className={cn(TEXT_BUTTON, 'ml-auto')}
                data-slot="quest-later"
                {...model.dismissProps}
              >
                {model.dismissLabel}
              </button>
            </div>
            {/* the rail names every quest, so the next step's instructions have no hover left to
                hang on and no line on the board: they stay for assistive tech only */}
            {model.hint && (
              <small className="sr-only" data-slot="quest-hint">
                {model.hint}
              </small>
            )}
            {model.errorMessage && (
              <span className="text-small text-error-text" data-slot="questbar-error" {...model.errorProps}>
                {model.errorMessage}
              </span>
            )}
            <div className={CHIPS} data-slot="questbar-inner">
              {steps.map((chip) => {
                const content = (
                  <span key={chip.key} className={CHIP} data-slot="quest-chip">
                    <span aria-hidden="true">{chip.done ? '✅' : '⬜'}</span>
                    <span className="sr-only">{chip.statusLabel} </span>{' '}
                    {chip.title}{' '}
                    <em className="text-small not-italic" aria-hidden="true">{chip.rewardLabel}</em>
                    <span className="sr-only">, {chip.rewardAriaLabel}</span>
                  </span>
                )
                return chip.linkProps ? (
                  <Link key={chip.key} {...chip.linkProps} className={cn(CHIP_LINK, 'group')}>
                    {content}
                  </Link>
                ) : (
                  content
                )
              })}
            </div>
          </div>
          {claim && (
            <button
              type="button"
              data-slot="quest-claim"
              className={cn(
                CLAIM_BUTTON,
                /* the phone board gives the claim the rail's full width (`7D3-0` 314) */
                'max-2xl:w-full',
                claim.busy
                  ? 'cursor-progress opacity-100'
                  : 'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
              )}
              {...claim.buttonProps}
            >
              🎁 {claim.label}
            </button>
          )}
        </div>
      )}

      <DialogFrame
        id={model.pack.id}
        open={model.pack.open}
        onOpenChange={model.pack.onOpenChange}
        // the model recorded the opener; without it a press on the scrim strands focus on <main>
        finalFocus={model.pack.opener}
        title={
          <>
            <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} /> 🎁
            Starter pack opened!
          </>
        }
        titleId={model.pack.titleId}
        close={{ label: model.pack.closeLabel }}
        description={model.pack.description}
        // the legacy `<p class="muted">` kept the body size and its UA paragraph margins
        descriptionClassName="my-4 text-body"
      >
        {model.pack.showCards && (
          <div className={PACK_GRID} data-slot="pack-grid">
            {model.pack.cards.map((card) => (
              <MemeCard key={card.id} model={card} />
            ))}
          </div>
        )}
        <FilterBar className="mt-4">
          <Link className={buttonClasses('primary')} {...model.pack.binderLinkProps}>
            View in My Binder
          </Link>
          <Button {...model.pack.exploreButtonProps}>Keep exploring</Button>
        </FilterBar>
      </DialogFrame>
    </>
  )
}
