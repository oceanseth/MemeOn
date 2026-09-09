import type { TradeSideSummaryModel } from './tradeCardModel'

/** One side of a trade, including offered meme shares and braincells. */
export function SideSummary({ model }: { model: TradeSideSummaryModel }) {
  return (
    <div className="trade-side">
      <h4>{model.ownerLabel}</h4>
      {model.empty && <div>nothing 😶</div>}
      {model.memeLines.map((meme) => <div key={meme.id}>{meme.sharesLabel} <em>"{meme.title}"</em></div>)}
      {model.coinsLabel && <div>{model.coinsLabel}</div>}
    </div>
  )
}
