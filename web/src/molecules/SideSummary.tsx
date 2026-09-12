import { TierChip } from '../atoms/TierChip'
import { cn } from '../lib/cn'
import type { TradeSideSummaryModel } from '../lib/tradeCardModel'

/** Recessed well inside the raised proposal card. */
const WELL = cn(
  'rounded-[20px] bg-surface-pressed p-[15px] shadow-pressed',
  'text-small [overflow-wrap:anywhere] [&_em]:[overflow-wrap:anywhere]',
)

/** Owner label: caption, bold, ink-muted. */
const LEGEND = 'mt-0 mb-2 font-sans text-caption font-bold tracking-normal text-ink-muted'

const LINE = 'flex items-center gap-2'

/** 30px thumb, radius 9, 2px line ring. */
const THUMB = 'size-[30px] shrink-0 rounded-[9px] border-2 border-line bg-surface-raised object-cover'

const MEME_LINE = 'min-w-0 font-sans text-caption font-medium text-ink'
const COINS = 'font-sans text-small font-medium text-ink tabular-nums'

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
