import { TierChip } from '@/atoms/tier-chip'
import { cn } from '../lib/cn'
import type { TradeSideSummaryModel } from '../lib/tradeCardModel'

/** Recessed well inside the raised proposal card. */
const WELL = cn(
  'rounded-lg material-pressed p-4',
  'text-small wrap-anywhere [&_em]:wrap-anywhere',
)

/** Owner label: caption, bold, ink-muted. */
const LEGEND = 'mt-0 mb-2 font-sans text-caption font-bold tracking-normal text-muted-foreground'

const LINE = 'flex items-center gap-2'

/** 36px thumb, radius 9, 2px line ring — board 30px, bumped for legibility in the well. */
const THUMB = 'size-9 shrink-0 rounded-xs border-2 border-border bg-accent object-cover'

const MEME_LINE = 'min-w-0 font-sans text-caption font-medium text-foreground'
const COINS = 'font-sans text-small font-medium text-foreground tabular-nums'

export function SideSummary({ model }: { model: TradeSideSummaryModel }) {
  return (
    <div data-slot="trade-side" className={WELL}>
      <h3 className={LEGEND}>{model.ownerLabel}</h3>
      {model.empty && <div className="text-muted-foreground">nothing 😶</div>}
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
