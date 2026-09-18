import type { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { DialogFooter } from '@/atoms/dialog'
import { MemeCard } from '@/atoms/meme-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/atoms/popover'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { Progress } from '@/atoms/progress'
import { cn } from '@/lib/cn'
import type { QuestBarModel } from '../lib/questBarModel'
import { portalAnchor } from '../lib/portalAnchor'
import { DialogFrame } from '@/molecules/dialog-frame'
import { Icon } from '@/atoms/icon'
import './quest-bar.css'

/** One path, changed once when the asset lands under public/brand/. */
const BRAINCELL_SRC = '/api/brand/braincell.png'

/** `inline-block` is load-bearing in the dialog heading: preflight would drop the coin onto its own line. */
const BRAINCELL_IMG = 'inline-block size-6.5 rounded-full object-cover align-middle'

/** One ladder per page (it lives in the header), so the meter can name itself by the title's id. */
const TITLE_ID = 'questbar-title'

/** One popover per page — it lives in the header — so one anchor id is enough (see AlertsBell). */
const ANCHOR_ID = 'quest-pop-anchor'

/**
 * The braincell pill: "2,480", 40 tall in the header, 36 in the phone cluster. Plain, it is a
 * raised span. While the ladder is live it is the popover's trigger and wears the ring
 * (`quest-bar.css`): the Button's own raised recipe on a plain `<button>`, rounded to a true pill
 * so the ring's `border-radius: inherit` hugs it, `hit-44`'s `position: relative` anchoring the
 * arc. `aria-expanded` swaps the material for the pressed well, the same tell every toggle wears.
 */
const PILL = cn(
  'inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-4',
  'text-base font-semibold whitespace-nowrap text-foreground tabular-nums',
  'max-xl:h-9 max-xl:px-3 max-xl:text-sm',
)
const PILL_STATIC = cn(PILL, 'material-raised')
const PILL_TRIGGER = cn(
  buttonVariants({ size: 'sm' }),
  PILL,
  'aria-expanded:material-pressed',
)

/**
 * The claim-ready dot on the pill's corner: the pack is waiting, and the ring alone would not say
 * so. It is the braincell colour — the count's own ink, deep in light and pale in dark — with the
 * canvas as a halo so it reads over both the pill and the ring.
 */
const CLAIM_DOT = cn(
  'absolute -top-0.5 -right-0.5 size-3 rounded-full bg-braincell ring-2 ring-background',
  'motion-safe:animate-pulse',
)

/**
 * ≤480 the panel leaves the anchor and pins itself under the whole header, gutter to gutter, as
 * the alerts panel does; Base UI writes the anchored geometry into the positioner's `style` and
 * an author `!important` declaration is the one thing that outranks it.
 */
const POSITIONER = cn(
  'max-xs:fixed! max-xs:top-(--topbar-h)! max-xs:right-3! max-xs:left-3!',
  'max-xs:w-auto! max-xs:transform-none!',
)

/** The ladder's card: 380 wide; the atom's popup owns the scroll and the available height. */
const PANEL = 'w-[min(380px,calc(100vw-24px))] max-xs:w-auto'

/** The panel's title: Onest lg at 600 (a popover, not a band, so not the display face), the mascot ahead of it. */
const TITLE = cn(
  'inline-flex min-w-0 items-center gap-2 whitespace-nowrap',
  'text-lg font-semibold text-foreground',
)

/** One quest per row: the check, the title, the reward at the end; a linked row darkens on hover. */
const CHIP = cn(
  'flex min-h-9 items-center gap-2.5 text-base font-medium text-muted-foreground',
  'transition-tint',
  'group-hover:text-foreground',
)

const CHIP_LINK = cn(
  'no-underline',
  'focus-ring rounded-sm',
)

/** The card grid with the starter pack's tighter tracks; under 561px only the gap tightens. */
const PACK_GRID = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5 p-0 max-sm:gap-3'

export interface QuestBarProps {
  /** The ladder, or nothing: without it the pill is the plain balance. */
  model: QuestBarModel | null
  /** The balance figure and the name it announces. */
  balance: { text: string; label: string }
}

/**
 * The onboarding ladder, tucked into the braincell pill: the ring on the pill is the meter, and a
 * press opens the whole rail — title and count, the progress bar, every quest with its reward,
 * the claim pill, Later. Parent owns steps, pack dialog, claim, and dismiss; Base UI owns the
 * popover's open state, and `actionsRef.close()` dismisses the panel before the pack dialog opens
 * so the positioner cannot drift off-screen.
 */
export function QuestBar({ model, balance }: QuestBarProps) {
  const live = model !== null && model.visible && model.showSteps
  const claim = model?.chips.find((chip) => chip.kind === 'claim')
  const steps = model?.chips.filter((chip) => chip.kind === 'step') ?? []
  const done = steps.filter((chip) => chip.done).length
  const popoverActions = useRef<PopoverPrimitive.Root.Actions | null>(null)

  const figure = (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <Icon name="brain" size={18} />
      {balance.text}
    </span>
  )

  return (
    <>
      {live ? (
        <div className="relative" data-slot="questbar">
          <Popover defaultOpen={model.defaultOpen} actionsRef={popoverActions}>
            <PopoverTrigger
              render={<button type="button" className={PILL_TRIGGER} />}
              data-slot="quest-trigger"
              data-progress={model.progressPercent}
            >
              {figure}
              {/* one sr-only run, so the name reads "120 braincells, quests 0 of 5" without a stray space */}
              <span className="sr-only">{balance.label}, {model.progressLabel}</span>
              {claim && <span className={CLAIM_DOT} aria-hidden="true" data-slot="quest-claim-dot" />}
            </PopoverTrigger>
            <PortalAnchor id={ANCHOR_ID} />
            <PopoverContent
              container={portalAnchor(ANCHOR_ID)}
              align="end"
              /* a panel that flipped above the header would leave the viewport, so it never flips */
              collisionAvoidance={{ side: 'none', align: 'shift' }}
              positionerClassName={POSITIONER}
              className={PANEL}
              aria-labelledby={TITLE_ID}
              data-slot="quest-panel"
            >
              <div className="flex flex-col gap-3 p-1.5" data-slot="questbar-head">
                <div className="flex items-center gap-x-3">
                  <span id={TITLE_ID} className={TITLE} data-slot="questbar-title">
                    <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} />
                    <span className="truncate">Earn your braincells</span>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums" data-slot="questbar-count">
                      {model.completionLabel}
                    </span>
                  </span>
                  {/* ghost, so the claim pill stays the only loud control in the panel */}
                  <Button variant="ghost" size="xs" className="ml-auto" data-slot="quest-later" {...model.dismissProps}>
                    {model.dismissLabel}
                  </Button>
                </div>
                {/* the ladder as a meter, named by the title beside it; the rows below list every step */}
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
                <ul className="m-0 flex list-none flex-col p-0" data-slot="questbar-inner">
                  {steps.map((chip) => {
                    const content = (
                      <span className={CHIP} data-slot="quest-chip">
                        <span aria-hidden="true">
                          {chip.done ? <Icon name="circle-check" size={18} /> : <Icon name="square" size={18} />}
                        </span>
                        <span className="sr-only">{chip.statusLabel} </span>
                        <span className="min-w-0 flex-1">{chip.title}</span>
                        <em className="inline-flex items-center gap-1 text-sm not-italic tabular-nums" aria-hidden="true">
                          <Icon name="brain" size={14} />
                          {chip.rewardLabel}
                        </em>
                        <span className="sr-only">, {chip.rewardAriaLabel}</span>
                      </span>
                    )
                    return (
                      <li key={chip.key}>
                        {chip.linkProps ? (
                          <Link {...chip.linkProps} className={cn(CHIP_LINK, 'group block')}>
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </li>
                    )
                  })}
                </ul>
                {/* the neutral raised claim pill — not the chrome primary; busy = full opacity, progress cursor */}
                {claim && (
                  <Button
                    className="w-full"
                    busy={claim.busy}
                    data-slot="quest-claim"
                    {...claim.buttonProps}
                    onClick={(event) => {
                      popoverActions.current?.close()
                      claim.buttonProps.onClick?.(event)
                    }}
                  >
                    <Icon name="gift" size={16} /> {claim.label}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <span className={PILL_STATIC} data-slot="coins">
          {figure}
          <span className="sr-only">{balance.label}</span>
        </span>
      )}

      {model && (
        <DialogFrame
          id={model.pack.id}
          open={model.pack.open}
          onOpenChange={model.pack.onOpenChange}
          // the model recorded the opener; without it a press on the scrim strands focus on <main>
          finalFocus={model.pack.opener}
          title={
            <>
              <img className={BRAINCELL_IMG} src={BRAINCELL_SRC} alt="" width={26} height={26} /> <Icon name="gift" size={16} />
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
            <Link
              {...model.pack.binderLinkProps}
              className={buttonVariants({ variant: 'primary' })}
              data-slot="pack-binder-link"
            >
              View in My Binder
            </Link>
            <Button data-slot="pack-explore" {...model.pack.exploreButtonProps}>
              Keep exploring
            </Button>
          </DialogFooter>
        </DialogFrame>
      )}
    </>
  )
}
