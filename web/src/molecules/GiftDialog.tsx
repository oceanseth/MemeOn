import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { FilterBar } from '../atoms/PageHead'
import { cn } from '../lib/cn'
import type { GiftDialogModel } from '../lib/giftDialogModel'
import { DialogFrame } from './DialogFrame'

/** `.gift-row`: the button atom's chrome, laid out as a full-width row that wraps rather than clips. */
const ROW = 'w-full flex-wrap justify-start gap-2.5 px-2.5 py-[7px] text-left'

/** Gold has to survive the atom's hover border, which the legacy sheet won on declaration order. */
const ROW_PICKED = cn(
  'border-gold [&:not(:disabled):hover]:border-gold',
  'bg-[color-mix(in_oklab,var(--color-gold)_8%,transparent)]',
)

/**
 * The rarity chip, rebuilt from `.tier-chip` so the row carries its own paint. The gradient frame
 * around the art still borrows `tier-<key>` from the un-migrated card sheet: seven tier gradients
 * belong to that package, not to this one, and the class dies with it.
 */
const TIER_CHIP = cn(
  'inline-flex max-w-full shrink-0 items-center gap-[5px] rounded-pill border border-current',
  'bg-black/45 px-[9px] py-[3px] text-center text-[11px] font-extrabold tracking-[0.8px] uppercase',
  '[overflow-wrap:anywhere]',
)

/**
 * Gift shares from your binder to a friend. Its engine supplies all behavior, including the
 * in-flight lockdown: while the transfer runs every control here is disabled, not live-but-inert.
 */
export function GiftDialog({ model }: { model: GiftDialogModel }) {
  const searchId = `${model.id}-search`
  return (
    <DialogFrame
      id={model.id}
      open={model.open}
      onOpenChange={model.onOpenChange}
      title={model.title}
      titleId={model.titleId}
      description={model.hint}
      descriptionId={model.hintId}
      descriptionClassName="mt-1 mb-3"
      close={{ label: model.closeLabel, disabled: model.busy }}
      // Base UI parks focus on the first tab stop (the ✕); the binder search is the actual task
      initialFocus={() => document.getElementById(searchId)}
    >
      <Input
        id={searchId}
        type="search"
        placeholder="Search your binder…"
        className="block w-full"
        {...model.searchInputProps}
      />
      <div
        className="flex max-h-75 flex-col gap-1.5 overflow-y-auto [scrollbar-width:thin]"
        data-slot="gift-list"
      >
        {/* my-4 is the UA paragraph margin preflight removed; the empty binder read as a gap, not a row */}
        {model.showEmpty && <p className="my-4 leading-[1.55] text-text-dim">{model.emptyMessage}</p>}
        {model.rows.map((row) => (
          <Button key={row.id} className={cn(ROW, row.selected && ROW_PICKED)} {...row.buttonProps}>
            {/* the tier gradient paints a 2px frame around the art: the one moment rarity is handed away */}
            <span className={cn('block shrink-0 rounded-[10px] p-0.5 leading-[0]', `tier-${row.tierKey}`)}>
              <img {...row.imageProps} className="size-10 shrink-0 rounded-lg object-cover" />
            </span>
            <span className="flex-[1_1_120px] overflow-hidden font-semibold text-ellipsis">
              {row.title}
            </span>
            <span className="shrink-0 text-xs text-text-dim">{row.sharesLabel}</span>
            <span className={TIER_CHIP} style={{ color: row.tierColor }}>
              {row.tierLabel}
            </span>
            {row.listed && <Badge className="shrink-0">{row.listedLabel}</Badge>}
          </Button>
        ))}
      </div>
      <FilterBar className="mt-3">
        {model.showControls && (
          <label className="inline-flex items-center gap-1.5 text-sm text-text-dim">
            {model.sharesLabel}{' '}
            <Input type="number" className="w-21" {...model.sharesInputProps} />{' '}
            <span>{model.sharesMaxLabel}</span>
          </label>
        )}
        <span className="flex-1" />
        <Button {...model.cancelButtonProps}>{model.cancelLabel}</Button>
        {model.showControls && (
          <Button variant="primary" {...model.submitButtonProps}>
            {model.submitLabel}
          </Button>
        )}
      </FilterBar>
      {/* mounted before the copy arrives, so the failure is announced rather than merely displayed */}
      <div role="alert" data-slot="gift-error">
        {model.error && (
          <Notice tone="error" role="none">
            {model.error}
          </Notice>
        )}
      </div>
    </DialogFrame>
  )
}
