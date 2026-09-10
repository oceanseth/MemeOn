import type { TradeSideSummaryModel } from './tradeCardModel'

/** One side of a trade, including offered meme shares and braincells. */
export function SideSummary({ model }: { model: TradeSideSummaryModel }) {
  return (
    <div
      data-slot="trade-side"
      className="rounded-control border border-border bg-bg-card p-3 text-sm [overflow-wrap:anywhere] [&_em]:[overflow-wrap:anywhere]"
    >
      {/* the composer's legend speaks this same vocabulary */}
      <h3 className="mt-0 mb-2 text-[12px] leading-[1.2] font-bold tracking-[0.7px] text-text-dim uppercase">
        {model.ownerLabel}
      </h3>
      {model.empty && <div>nothing 😶</div>}
      {model.memeLines.map((meme) => (
        <div key={meme.id}>
          {meme.sharesLabel} <em>"{meme.title}"</em>
        </div>
      ))}
      {model.coinsLabel && <div>{model.coinsLabel}</div>}
    </div>
  )
}
