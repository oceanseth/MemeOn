import type { TradeCardModel } from './tradeCardModel'
import { SideSummary } from './SideSummary'

export function TradeCard({ model }: { model: TradeCardModel }) {
  return (
    <div className="trade-card">
      <div className="trade-card-head">
        <div className="trade-parties">
          <strong>{model.partiesLabel}</strong>
          <span className="badge">{model.statusLabel}</span>
        </div>
        <span className="spacer" />
        <time className="trade-time" dateTime={model.createdAtIso} title={model.createdTitle}>
          {model.createdLabel}
        </time>
      </div>
      <div className="trade-sides">
        <SideSummary model={model.offer} />
        <div className="trade-swap" aria-hidden="true">
          ⇄
        </div>
        <SideSummary model={model.ask} />
      </div>
      {model.actions.length > 0 && (
        <div className="filter-bar">
          {model.actions.map((action) => (
            <button key={action.kind} className={action.className} {...action.buttonProps}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
