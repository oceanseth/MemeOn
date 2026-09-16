import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia } from '@/atoms/item'
import { TierChip } from '@/atoms/tier-chip'
import { cn } from '../lib/cn'
import type { TradeSideSummaryModel } from '../lib/tradeCardModel'

/** Recessed well inside the raised proposal card. */
const WELL = cn(
  'rounded-lg material-pressed p-4',
  'text-sm wrap-anywhere [&_em]:wrap-anywhere',
)

/** Owner label: caption, bold, ink-muted. */
const LEGEND = 'mt-0 mb-2 font-sans text-sm font-semibold text-muted-foreground'

/** 36px thumb, radius 9, 2px line ring — board 30px, bumped for legibility in the well. */
const THUMB = 'size-9 shrink-0 rounded-xs border-2 border-border bg-accent object-cover'

/** The line's own step: 14/500, a size under the row title the `Item` atom would set. */
const MEME_LINE = 'font-sans text-sm font-medium text-foreground'
const COINS = 'font-sans text-sm font-medium text-foreground tabular-nums'

/** One side of a trade: the owner legend, then an `Item` row per meme, then the coins line. */
export function SideSummary({ model }: { model: TradeSideSummaryModel }) {
  return (
    <div data-slot="trade-side" className={WELL}>
      <h3 className={LEGEND}>{model.ownerLabel}</h3>
      {model.empty && <div className="text-muted-foreground">nothing 😶</div>}
      <ItemGroup>
        {model.memeLines.map((meme) => (
          <Item key={meme.id} size="sm">
            <ItemMedia>
              {meme.thumbUrl ? (
                <img className={THUMB} src={meme.thumbUrl} alt="" loading="lazy" />
              ) : (
                <span className={cn(THUMB, 'block')} aria-hidden="true" />
              )}
            </ItemMedia>
            <ItemContent>
              <span className={MEME_LINE}>
                {meme.sharesLabel} <em>"{meme.title}"</em>
              </span>
            </ItemContent>
            {meme.tierKey && meme.tierName && (
              <ItemActions>
                <TierChip tierKey={meme.tierKey} label={meme.tierName} />
              </ItemActions>
            )}
          </Item>
        ))}
        {model.coinsLabel && (
          <div className={COINS}>{model.coinsLabel}</div>
        )}
      </ItemGroup>
    </div>
  )
}
