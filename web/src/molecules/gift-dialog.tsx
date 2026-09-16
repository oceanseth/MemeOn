import { Notice } from '@/atoms/alert'
import { Badge } from '@/atoms/badge'
import { Button } from '@/atoms/button'
import { DialogFooter } from '@/atoms/dialog'
import { Input } from '@/atoms/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/atoms/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/atoms/item'
import { Label } from '@/atoms/label'
import { LiveRegion } from '@/atoms/live-region'
import { TierChip } from '@/atoms/tier-chip'
import { cn } from '@/lib/cn'
import type { GiftDialogModel } from '../lib/giftDialogModel'
import { DialogFrame } from '@/molecules/dialog-frame'

/**
 * The scrolling list well. While the transfer runs every row is `disabled`, and `Item` carries the
 * disabled look and drops its hover tint for a disabled button row.
 */
const LIST = 'max-h-75 overflow-y-auto scrollbar-thin'

/**
 * Gift shares from your binder to a friend. Its engine supplies all behavior, including the
 * in-flight lockdown: while the transfer runs every control here is disabled, not live-but-inert.
 *
 * A row is an `Item` rendered as the button itself (`aria-pressed` from the model marks the pick),
 * so the whole card taps and its title is its name. The pick wears the muted well.
 */
export function GiftDialog({ model }: { model: GiftDialogModel }) {
  const searchId = `${model.id}-search`
  const sharesId = `${model.id}-shares`
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
      close={{ label: model.closeLabel, disabled: model.busy }}
      // Base UI parks focus on the first tab stop (the ✕); the binder search is the actual task
      initialFocus={() => document.getElementById(searchId)}
    >
      <Input
        id={searchId}
        type="search"
        placeholder="Search your binder…"
        className="w-full"
        {...model.searchInputProps}
      />
      <div className={cn(LIST, model.busy && 'pointer-events-none')} data-slot="gift-list">
        {/* my-4 is the UA paragraph margin preflight removed; the empty binder read as a gap, not a row */}
        {model.showEmpty && <p className="my-4 text-base text-muted-foreground">{model.emptyMessage}</p>}
        <ItemGroup>
          {model.rows.map((row) => (
            <Item
              key={row.id}
              render={<button type="button" {...row.buttonProps} />}
              aria-pressed={row.selected}
              className="text-left"
            >
              <ItemMedia variant="image">
                <img {...row.imageProps} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{row.title}</ItemTitle>
                <ItemDescription>{row.sharesLabel}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {/* the one place rarity says its own name: the seal the cards already wear */}
                <TierChip tierKey={row.tierKey} label={row.tierLabel} />
                {row.listed && <Badge variant="info">{row.listedLabel}</Badge>}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </div>
      <DialogFooter>
        {/* a bare Label, not a Field: Field would name the control by this word through
            `aria-labelledby`, over the model's fuller `aria-label` ("Shares to gift, up to N") */}
        {model.showControls && (
          <div className="mr-auto flex items-center gap-2" data-slot="gift-shares">
            <Label htmlFor={sharesId}>{model.sharesLabel}</Label>
            <InputGroup className="w-40">
              <InputGroupInput id={sharesId} type="number" {...model.sharesInputProps} />
              <InputGroupAddon align="inline-end">{model.sharesMaxLabel}</InputGroupAddon>
            </InputGroup>
          </div>
        )}
        <Button {...model.cancelButtonProps}>{model.cancelLabel}</Button>
        {model.showControls && (
          <Button variant="primary" {...model.submitButtonProps}>
            {model.submitLabel}
          </Button>
        )}
      </DialogFooter>
      {/* mounted before the copy arrives, so the failure is announced rather than merely displayed.
          Still the transitional `Notice`, not `Alert`: `hooks/social-regressions.runtime.test.tsx`
          reads the band as `[data-slot="notice"]` (LEDGER L13); E1 moves the probe and the band together */}
      <LiveRegion politeness="assertive" variant="visible" data-slot="gift-error">
        {model.error && (
          <Notice tone="error" role="none">
            {model.error}
          </Notice>
        )}
      </LiveRegion>
    </DialogFrame>
  )
}
