import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { FilterBar } from '../atoms/PageHead'
import { SideSummary } from './SideSummary'
import type { TradeCardModel } from './tradeCardModel'

export function TradeCard({ model }: { model: TradeCardModel }) {
  return (
    <div data-slot="trade-card" className="rounded-card border border-border bg-bg-raised p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <strong>{model.partiesLabel}</strong>
          <Badge>{model.statusLabel}</Badge>
        </div>
        <span className="flex-1" />
        <time
          className="text-xs text-text-dim"
          dateTime={model.createdAtIso}
          title={model.createdTitle}
        >
          {model.createdLabel}
        </time>
      </div>
      {/* ≤760 the deal reads give-above / get-below */}
      <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 [&>*]:min-w-0 max-xl:grid-cols-1 max-xl:gap-2.5">
        <SideSummary model={model.offer} />
        <div
          aria-hidden="true"
          className="text-[22px] leading-none max-xl:rotate-90 max-xl:justify-self-center"
        >
          ⇄
        </div>
        <SideSummary model={model.ask} />
      </div>
      {model.actions.length > 0 && (
        <FilterBar>
          {model.actions.map((action) => (
            <Button key={action.kind} variant={action.variant} {...action.buttonProps}>
              {action.label}
            </Button>
          ))}
        </FilterBar>
      )}
    </div>
  )
}
