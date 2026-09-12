import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { Notice } from '../atoms/Notice'
import { FilterBar } from '../atoms/PageHead'
import { TierChip } from '../atoms/TierChip'
import { cn } from '../lib/cn'
import type { GiftDialogModel } from '../lib/giftDialogModel'
import { DialogFrame } from './DialogFrame'

/**
 * A row is the Button atom laid out as a full-width list item: the pill's own raised material at
 * rest, and the pressed well the atom already gives `aria-pressed` when it is the pick. No bespoke
 * "selected" border survives — the relief is the state, as every other tab and toggle in the app.
 */
const ROW = cn(
  'h-auto min-h-[62px] w-full flex-wrap justify-start gap-2.5 px-3 py-2 text-left',
  '[line-height:1.3]',
)

/** The thumbnail plate: the card system's recessed art well, one step down from the row. */
const THUMB = 'block size-11 shrink-0 overflow-hidden rounded-[12px] bg-surface-pressed'

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
      // the model recorded the opener; without it a press on the scrim strands focus on <main>
      finalFocus={model.opener}
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
        className="mt-3 flex max-h-75 flex-col gap-2 overflow-y-auto [scrollbar-width:thin]"
        data-slot="gift-list"
      >
        {/* my-4 is the UA paragraph margin preflight removed; the empty binder read as a gap, not a row */}
        {model.showEmpty && <p className="my-4 text-label leading-[1.55] text-ink-muted">{model.emptyMessage}</p>}
        {model.rows.map((row) => (
          <Button key={row.id} className={ROW} {...row.buttonProps}>
            <span className={THUMB}>
              <img {...row.imageProps} className="size-full object-cover" />
            </span>
            <span className="flex-[1_1_120px] overflow-hidden font-semibold text-ellipsis">
              {row.title}
            </span>
            <span className="shrink-0 text-micro text-ink-muted tabular-nums">{row.sharesLabel}</span>
            {/* the one place rarity says its own name: the seal the cards already wear */}
            <TierChip tierKey={row.tierKey} label={row.tierLabel} className="shrink-0" />
            {row.listed && (
              <Badge tone="info" className="shrink-0">
                {row.listedLabel}
              </Badge>
            )}
          </Button>
        ))}
      </div>
      <FilterBar className="mt-4">
        {model.showControls && (
          <label className="inline-flex items-center gap-2 text-label text-ink-muted">
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
