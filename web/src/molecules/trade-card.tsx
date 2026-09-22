import { Badge } from '@/atoms/badge'
import { Button } from '@/atoms/button'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/atoms/card'
import { cn } from '../lib/cn'
import { SideSummary } from '@/molecules/side-summary'
import { Icon } from '@/atoms/icon'
import type { TradeCardModel } from '../lib/tradeCardModel'

/** Give/get stay left/right regardless of proposer — "You give" is always the left plate. */
const DEAL = cn(
  /* stretch, not center: equal-height wells read as one comparison */
  'my-3.5 grid grid-cols-(--grid-trade) items-stretch gap-3.5 *:min-w-0',
  'max-xl:grid-cols-1 max-xl:gap-2.5',
)

/** Swap glyph uses `--color-link`: `--color-ring` fails contrast on surface text. */
const SWAP = cn(
  'self-center font-display text-3xl text-link',
  'max-xl:rotate-90 max-xl:justify-self-center',
)

/**
 * One trade proposal: the `Card` atom at its 20px inset, the parties line as its title, the status
 * as the header's action slot, the two wells, and the responses in the footer.
 */
export function TradeCard({ model }: { model: TradeCardModel }) {
  return (
    <Card data-slot="trade-card" size="sm">
      <CardHeader>
        {/* a proposal line is a card headline, not an outline level: Onest 18/26 at 600 */}
        <CardTitle render={<strong />}>{model.partiesLabel}</CardTitle>
        <CardDescription>
          {model.waitingLabel} ·{' '}
          <time dateTime={model.createdAtIso} title={model.createdTitle}>
            {model.createdLabel}
          </time>
        </CardDescription>
        {model.showStatusBadge && (
          <CardAction>
            <Badge>
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">
                  <Icon name={model.statusIcon} size={14} />
                </span>{' '}
                {model.statusLabel}
              </span>
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <div className={DEAL}>
        <SideSummary model={model.give} />
        <div aria-hidden="true" className={SWAP}>
          ⇄
        </div>
        <SideSummary model={model.get} />
      </div>
      {model.finalityLine && (
        <p data-slot="trade-finality" className="m-0 mb-3.5 text-sm text-muted-foreground">
          {model.finalityLine}
        </p>
      )}
      {model.actions.length > 0 && (
        <CardFooter className="justify-end">
          {model.actions.map((action) => (
            <Button key={action.kind} variant={action.variant} {...action.buttonProps}>
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
