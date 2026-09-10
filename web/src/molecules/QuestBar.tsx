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

const QUESTBAR = cn(
  'border-b border-border',
  'bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-primary-from)_14%,transparent),color-mix(in_oklab,var(--color-primary-to)_14%,transparent))]',
)

/** `relative` contains the chips' visually-hidden text inside the ≤720 scroller. */
const INNER = 'relative mx-auto flex max-w-page flex-wrap items-center gap-2.5 px-5 py-2'

/** ≤720: one swipeable quest row with a truncation cue instead of a four-row block. */
const SCROLLER = cn(
  'max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:py-1.5',
  'max-lg:[scroll-snap-type:x_mandatory] max-lg:[scrollbar-width:none]',
  'max-lg:[mask-image:linear-gradient(to_right,oklch(0_0_0)_90%,transparent)]',
  'max-lg:[&::-webkit-scrollbar]:hidden',
  'max-lg:[&>*]:flex-none max-lg:[&>*]:[scroll-snap-align:start]',
)

/**
 * "Show all" is a request for the whole ladder: rows, no scroller, no edge fade. Rows may shrink
 * and wrap their text, which the scroller's fixed-basis items would not.
 */
const EXPANDED = 'max-lg:py-1.5 [&>*]:min-w-0'

const CHIP = cn(
  'rounded-pill border border-border px-2.5 py-[3px] text-xs whitespace-nowrap text-text-dim',
  'group-hover:border-accent group-hover:text-text',
)

const CHIP_DONE = 'border-[color-mix(in_oklab,var(--color-ok)_35%,transparent)] text-ok'

const CHIP_LINK = cn(
  'no-underline',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
)

/** Disclosure and dismiss are text-weight so the claim CTA stays the only loud control in the strip. */
const TEXT_BUTTON = cn(
  buttonClasses(),
  'border-0 bg-transparent px-2 py-1.5 text-xs text-text-dim hover:text-text',
)

/**
 * The claim CTA keeps the legacy `button[aria-busy='true']` treatment — full opacity and a
 * progress cursor, no spinner: in flight is not unavailable, and the label already says "Opening…".
 */
const CLAIM_BUTTON = cn(buttonClasses('primary'), 'px-3 py-1 text-xs')

/** The card grid with the starter pack's tighter tracks; under 561px only the gap tightens. */
const PACK_GRID = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5 p-0 max-sm:gap-3'

/**
 * Onboarding quest strip. Parent owns steps, pack dialog, and claim.
 * Collapsed to the next step by default; the parent owns expanded/dismissed.
 */
export function QuestBar({ model }: { model: QuestBarModel }) {
  if (!model.visible) return null

  return (
    <>
      {model.showSteps && (
        <div className={QUESTBAR} data-slot="questbar">
          <div
            className={cn(INNER, model.expanded ? EXPANDED : SCROLLER)}
            data-slot="questbar-inner"
            data-expanded={model.expanded || undefined}
          >
            <span
              className="inline-flex items-center gap-[7px] text-sm font-extrabold whitespace-nowrap"
              data-slot="questbar-title"
            >
              <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} />{' '}
              {/* the mark + count stay ≤720; the words would push the claim CTA off the first screenful */}
              <span className="max-lg:hidden">Earn your braincells ·</span>{' '}
              <span data-slot="questbar-count">{model.completionLabel}</span>
            </span>
            {model.chips.map((chip) => {
              if (chip.kind === 'claim') {
                return (
                  <button
                    key={chip.key}
                    type="button"
                    data-slot="quest-claim"
                    className={cn(
                      CLAIM_BUTTON,
                      chip.busy
                        ? 'cursor-progress opacity-100'
                        : 'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
                    )}
                    {...chip.buttonProps}
                  >
                    🎁 {chip.label}
                  </button>
                )
              }
              const content = (
                <span key={chip.key} className={cn(CHIP, chip.done && CHIP_DONE)} data-slot="quest-chip">
                  <span aria-hidden="true">{chip.done ? '✅' : '⬜'}</span>
                  <span className="sr-only">{chip.statusLabel} </span>{' '}
                  {chip.title} <em className="text-gold not-italic" aria-hidden="true">{chip.rewardLabel}</em>
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
              <small className="text-xs leading-[1.4] text-text-dim" data-slot="quest-hint">
                {model.hint}
              </small>
            )}
            {model.errorMessage && (
              <span className="text-sm text-danger" data-slot="questbar-error" {...model.errorProps}>
                {model.errorMessage}
              </span>
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
