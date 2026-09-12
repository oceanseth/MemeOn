import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { MemeCard } from '../atoms/MemeCard'
import { FilterBar } from '../atoms/PageHead'
import { cn } from '../lib/cn'
import type { QuestBarModel } from '../lib/questBarModel'
import { DialogFrame } from './DialogFrame'

/** One path, changed once when the asset lands under public/brand/. */
const BRAINCELL_SRC = '/api/brand/braincell.png'

/** `inline-block` is load-bearing in the dialog heading: preflight would drop the coin onto its own line. */
const BRAINCELL_IMG = 'inline-block h-[26px] w-[26px] rounded-full object-cover align-middle'

const FOCUS = cn(
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
)

/**
 * The reward rail as the My Binder board draws it (`Quest / Recessed reward rail`): a pressed well,
 * radius 24, 20/24 padding, sitting in the content column's 20px gutter so it lines up with the
 * page. The rows inside are the raised things.
 */
const RAIL = cn(
  'mx-5 mt-3 flex flex-col gap-3 rounded-[24px] bg-surface-pressed px-4 py-4 shadow-pressed',
  '2xl:mt-2 2xl:px-6 2xl:py-5',
)

/** Unbounded 20/25 tracking −0.025em: the rail's own heading. */
const TITLE = cn(
  'inline-flex items-center gap-[7px] whitespace-nowrap',
  'font-display text-[20px] leading-[25px] font-medium tracking-title text-ink',
)

/** `relative` contains the chips' visually-hidden text inside the ≤720 scroller. */
const CHIPS = 'relative flex flex-wrap items-center gap-x-6 gap-y-2'

/** ≤720: one swipeable quest row with a truncation cue instead of a four-row block. */
const SCROLLER = cn(
  'max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:py-0.5',
  'max-lg:[scroll-snap-type:x_mandatory] max-lg:[scrollbar-width:none]',
  'max-lg:[mask-image:linear-gradient(to_right,oklch(0_0_0)_90%,transparent)]',
  'max-lg:[&::-webkit-scrollbar]:hidden',
  'max-lg:[&>*]:flex-none max-lg:[&>*]:[scroll-snap-align:start]',
)

/**
 * "Show all" is a request for the whole ladder: rows, no scroller, no edge fade. Rows may shrink
 * and wrap their text, which the scroller's fixed-basis items would not.
 */
const EXPANDED = 'max-lg:py-0.5 [&>*]:min-w-0'

/** Onest 15/19 500 ink-muted, the emoji status as its own wayfinding; a linked chip darkens on hover. */
const CHIP = cn(
  'inline-flex items-center gap-1.5 text-label font-medium whitespace-nowrap text-ink-muted',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'group-hover:text-ink',
)

const CHIP_LINK = cn(
  'no-underline',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
  FOCUS,
)

/** Disclosure and dismiss are text-weight so the claim pill stays the only loud control in the rail. */
const TEXT_BUTTON = cn(
  'inline-flex min-h-8 cursor-pointer items-center rounded-[12px] border-0 bg-transparent px-2 py-1',
  'text-small font-medium text-ink-muted',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:text-ink',
  FOCUS,
)

/**
 * The claim pill as the board draws it: a neutral raised pill (46 tall at 900+, 40 below). The
 * sidebar's Mint pill is the chrome's one primary, so this one is not. It keeps the legacy
 * `button[aria-busy='true']` treatment — full opacity and a progress cursor, no spinner: in
 * flight is not unavailable, and the label already says "Opening…".
 */
const CLAIM_BUTTON = cn(
  'inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-[9px] whitespace-nowrap rounded-control px-4',
  'border-0 bg-surface-raised text-label font-semibold text-ink shadow-raised',
  '2xl:h-[46px] 2xl:px-[18px]',
  '[transition:transform_var(--dur-fast)_ease] motion-reduce:transition-none',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):hover]:-translate-y-px',
  'motion-reduce:[&:not(:disabled):hover]:translate-y-0!',
  'pointer-coarse:min-h-11',
  FOCUS,
)

/** The card grid with the starter pack's tighter tracks; under 561px only the gap tightens. */
const PACK_GRID = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5 p-0 max-sm:gap-3'

/**
 * Onboarding quest rail. Parent owns steps, pack dialog, and claim.
 * Collapsed to the next step by default; the parent owns expanded/dismissed.
 */
export function QuestBar({ model }: { model: QuestBarModel }) {
  if (!model.visible) return null

  const claim = model.chips.find((chip) => chip.kind === 'claim')
  const steps = model.chips.filter((chip) => chip.kind === 'step')

  return (
    <>
      {model.showSteps && (
        <div className={RAIL} data-slot="questbar">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-slot="questbar-head">
            <span className={TITLE} data-slot="questbar-title">
              <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} />{' '}
              {/* the mark + count stay ≤720; the words would push the claim pill off the first screenful */}
              <span className="max-lg:hidden">Earn your braincells ·</span>{' '}
              <span data-slot="questbar-count">{model.completionLabel}</span>
            </span>
            {model.errorMessage && (
              <span className="text-small text-error-text" data-slot="questbar-error" {...model.errorProps}>
                {model.errorMessage}
              </span>
            )}
            {claim && (
              <button
                type="button"
                data-slot="quest-claim"
                className={cn(
                  CLAIM_BUTTON,
                  'ml-auto',
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
          <div
            className={cn(CHIPS, model.expanded ? EXPANDED : SCROLLER)}
            data-slot="questbar-inner"
            data-expanded={model.expanded || undefined}
          >
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
            {model.hint && (
              <small className="text-small leading-[18px] text-ink-muted" data-slot="quest-hint">
                {model.hint}
              </small>
            )}
            {model.toggleProps && (
              <button type="button" className={TEXT_BUTTON} data-slot="quest-more" {...model.toggleProps}>
                {model.toggleLabel} <span aria-hidden="true">{model.expanded ? '▴' : '▾'}</span>
              </button>
            )}
            <button type="button" className={TEXT_BUTTON} data-slot="quest-later" {...model.dismissProps}>
              {model.dismissLabel}
            </button>
          </div>
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
        descriptionClassName="my-4 text-base"
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
