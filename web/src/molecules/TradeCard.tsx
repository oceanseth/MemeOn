import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { cn } from '../lib/cn'
import { SideSummary } from './SideSummary'
import type { TradeCardModel } from './tradeCardModel'

/** The proposal card the Trade board draws (`JXT-0`): a raised surface card, 20px of padding. */
const CARD = 'rounded-card border-0 bg-surface p-5 shadow-raised'

/** Unbounded 17/22 — a card headline, not a section heading. */
const HEADLINE = 'font-display text-[17px]/[22px] font-medium tracking-card-title text-ink'

/** "Waiting on you · just now" (`JXW-0`: 13/16 ink-muted). */
const SUBLINE = 'mt-1 block text-[13px]/[16px] text-ink-muted'

/**
 * Give and get are one comparison: side by side, the swap glyph between them, stacked ≤900. The
 * order is the board's (`JXT-0`) and never flips with whose proposal it is — "You give" is the left
 * plate, "You get" the right, so the ⇄ always points away from your binder.
 */
const DEAL = cn(
  /* `stretch`, not `center`: the two wells are one comparison and read as a pair of equal plates */
  'my-3.5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3.5 [&>*]:min-w-0',
  'max-2xl:grid-cols-1 max-2xl:gap-2.5',
)

/** The board paints the swap mark in the focus colour — the one place it is used as an accent. */
const SWAP = cn(
  'self-center font-display text-[27px]/[34px] text-focus',
  'max-2xl:rotate-90 max-2xl:justify-self-center',
)

const ACTIONS = 'flex flex-wrap items-center justify-end gap-3'

export function TradeCard({ model }: { model: TradeCardModel }) {
  return (
    <div data-slot="trade-card" className={CARD}>
      <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1">
        <div className="min-w-0 flex-1">
          <strong className={HEADLINE}>{model.partiesLabel}</strong>
          <span className={SUBLINE}>
            {model.waitingLabel} ·{' '}
            <time dateTime={model.createdAtIso} title={model.createdTitle}>
              {model.createdLabel}
            </time>
          </span>
        </div>
        {model.showStatusBadge && <Badge>{model.statusLabel}</Badge>}
      </div>
      <div className={DEAL}>
        <SideSummary model={model.give} />
        <div aria-hidden="true" className={SWAP}>
          ⇄
        </div>
        <SideSummary model={model.get} />
      </div>
      {model.finalityLine && (
        <p data-slot="trade-finality" className="m-0 mb-3.5 text-small text-ink-muted">
          {model.finalityLine}
        </p>
      )}
      {model.actions.length > 0 && (
        <div className={ACTIONS}>
          {model.actions.map((action) => (
            <Button key={action.kind} variant={action.variant} {...action.buttonProps}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
