import { TierChip } from '../atoms/TierChip'
import { cn } from '../lib/cn'
import type { TradeSideSummaryModel } from './tradeCardModel'

/**
 * One side of a deal: the recessed well the Trade board draws inside the proposal card (`JXX-0` —
 * surface-pressed, radius 20, 15px padding, the pressed relief). The card around it is the raised
 * thing; what is on offer sits *in* it.
 */
const WELL = cn(
  'rounded-[20px] bg-surface-pressed p-[15px] shadow-pressed',
  'text-small [overflow-wrap:anywhere] [&_em]:[overflow-wrap:anywhere]',
)

/** The well's own legend (`JXY-0` / `JY6-0`): Onest 13/16 weight 700 ink-muted, 8px above the row. */
const LEGEND = 'mt-0 mb-2 text-[13px]/[16px] font-bold text-ink-muted'

/** The board's meme row (`JXX-0`): thumb, then the line, 8px apart. */
const LINE = 'flex items-center gap-2'

/** The board's 30px thumb (`JXZ-0`): radius 9 inside a 2px line-toned ring. */
const THUMB = 'size-[30px] shrink-0 rounded-[9px] border-2 border-line bg-surface-raised object-cover'

/** Meme line 13/16 and the coin amount 14/18, both in the display face the board draws them in. */
const MEME_LINE = 'min-w-0 font-display text-[13px]/[16px] font-medium text-ink'
const COINS = 'font-display text-[14px]/[18px] font-medium text-ink tabular-nums'

export function SideSummary({ model }: { model: TradeSideSummaryModel }) {
  return (
    <div data-slot="trade-side" className={WELL}>
      <h3 className={LEGEND}>{model.ownerLabel}</h3>
      {model.empty && <div className="text-ink-muted">nothing 😶</div>}
      <div className="flex flex-col gap-2.5">
        {model.memeLines.map((meme) => (
          <div key={meme.id} className={LINE}>
            {meme.thumbUrl ? (
              <img className={THUMB} src={meme.thumbUrl} alt="" loading="lazy" />
            ) : (
              <span className={cn(THUMB, 'block')} aria-hidden="true" />
            )}
            <span className={MEME_LINE}>
              {meme.sharesLabel} <em>"{meme.title}"</em>
            </span>
            {meme.tierKey && meme.tierName && (
              <TierChip tierKey={meme.tierKey} label={meme.tierName} className="ml-auto shrink-0" />
            )}
          </div>
        ))}
        {model.coinsLabel && (
          <div className={COINS}>{model.coinsLabel}</div>
        )}
      </div>
    </div>
  )
}
