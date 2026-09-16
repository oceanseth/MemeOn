import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card } from '@/atoms/card'
import { DialogFooter } from '@/atoms/dialog'
import { MemeCard } from '@/atoms/meme-card'
import { Progress } from '@/atoms/progress'
import { cn } from '@/lib/cn'
import type { QuestBarModel } from '../lib/questBarModel'
import { DialogFrame } from '@/molecules/dialog-frame'

/** One path, changed once when the asset lands under public/brand/. */
const BRAINCELL_SRC = '/api/brand/braincell.png'

/** `inline-block` is load-bearing in the dialog heading: preflight would drop the coin onto its own line. */
const BRAINCELL_IMG = 'inline-block size-6.5 rounded-full object-cover align-middle'

/** One rail per page (it lives in the shell), so the meter can name itself by the title's id. */
const TITLE_ID = 'questbar-title'

/** Pressed well: quest lane left, claim pill right; stacks below 900. */
const RAIL = cn(
  'mx-5 mt-3 flex flex-wrap items-center gap-x-5 gap-y-3',
  'xl:mt-2 xl:flex-nowrap',
)

/** Unbounded 2xl; under the shell cut it steps to xl, the display face's floor. */
const TITLE = cn(
  'inline-flex items-center gap-2 whitespace-nowrap',
  'font-display text-2xl font-normal text-foreground',
  'max-xl:text-xl',
)

const CHIPS = 'flex flex-wrap items-center gap-x-6 gap-y-2 max-xl:gap-x-2'

/** Onest base 500 muted (sm on the phone); a linked chip darkens on hover. */
const CHIP = cn(
  'inline-flex items-center gap-1.5 text-base font-medium whitespace-nowrap text-muted-foreground',
  'max-xl:text-sm',
  'transition-tint',
  'group-hover:text-foreground',
)

const CHIP_LINK = cn(
  'no-underline',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
  'focus-ring',
)

/** The card grid with the starter pack's tighter tracks; under 561px only the gap tightens. */
const PACK_GRID = 'm-0 grid list-none items-start grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5 p-0 max-sm:gap-3'

/** Onboarding quest rail — parent owns steps, pack dialog, claim, and dismiss. */
export function QuestBar({ model }: { model: QuestBarModel }) {
  if (!model.visible) return null

  const claim = model.chips.find((chip) => chip.kind === 'claim')
  const steps = model.chips.filter((chip) => chip.kind === 'step')
  const done = steps.filter((chip) => chip.done).length

  return (
    <>
      {model.showSteps && (
        <Card variant="pressed" size="sm" className={RAIL} data-slot="questbar">
          <div className="flex min-w-0 flex-col gap-2.5 max-xl:w-full xl:flex-1" data-slot="questbar-head">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span id={TITLE_ID} className={TITLE} data-slot="questbar-title">
                <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} />{' '}
                Earn your braincells ·{' '}
                <span data-slot="questbar-count">{model.completionLabel}</span>
              </span>
              {/* dismiss ends the title row beside the claim pill at 900+, above it on phone; ghost, so
                  the claim pill stays the only loud control in the rail */}
              <Button variant="ghost" size="xs" className="ml-auto" data-slot="quest-later" {...model.dismissProps}>
                {model.dismissLabel}
              </Button>
            </div>
            {/* the ladder as a meter, named by the title beside it; the chips below list every step */}
            <Progress
              value={done}
              max={model.chips.length}
              aria-labelledby={TITLE_ID}
              data-slot="questbar-progress"
            />
            {/* hint is sr-only: every quest is visible inline, nothing to hover for instructions */}
            {model.hint && (
              <small className="sr-only" data-slot="quest-hint">
                {model.hint}
              </small>
            )}
            {model.errorMessage && (
              <Alert variant="error" size="compact" data-slot="questbar-error" {...model.errorProps}>
                {model.errorMessage}
              </Alert>
            )}
            <div className={CHIPS} data-slot="questbar-inner">
              {steps.map((chip) => {
                const content = (
                  <span key={chip.key} className={CHIP} data-slot="quest-chip">
                    <span aria-hidden="true">{chip.done ? '✅' : '⬜'}</span>
                    <span className="sr-only">{chip.statusLabel} </span>{' '}
                    {chip.title}{' '}
                    <em className="text-sm not-italic" aria-hidden="true">{chip.rewardLabel}</em>
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
          {/* the neutral raised claim pill — not the chrome primary; busy = full opacity, progress cursor */}
          {claim && (
            <Button className="max-xl:w-full" busy={claim.busy} data-slot="quest-claim" {...claim.buttonProps}>
              🎁 {claim.label}
            </Button>
          )}
        </Card>
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
      >
        {model.pack.showCards && (
          <div className={PACK_GRID} data-slot="pack-grid">
            {model.pack.cards.map((card) => (
              <MemeCard key={card.id} model={card} />
            ))}
          </div>
        )}
        <DialogFooter>
          {/* one element, one tab stop: a link wearing the pill, not a button inside a link */}
          <Link className={buttonVariants({ variant: 'primary' })} {...model.pack.binderLinkProps}>
            View in My Binder
          </Link>
          <Button {...model.pack.exploreButtonProps}>Keep exploring</Button>
        </DialogFooter>
      </DialogFrame>
    </>
  )
}
