import type { TradeCardModel } from './tradeCardModel'
import { SideSummary } from './SideSummary'

export function TradeCard({ model }: { model: TradeCardModel }) {
  return (
    <div className="trade-card">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <strong>{model.partiesLabel}</strong>
        <span className="badge">{model.statusLabel}</span>
        <span className="spacer" />
        <span style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>{model.createdLabel}</span>
      </div>
      <div className="trade-sides">
        <SideSummary model={model.offer} />
        <div style={{ fontSize: 22 }}>⇄</div>
        <SideSummary model={model.ask} />
      </div>
      {model.actions.length > 0 && (
        <div className="filter-bar">
          {model.actions.map((action) => (
            <button key={action.label} className={action.className} {...action.buttonProps}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
