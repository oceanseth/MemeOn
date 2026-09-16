import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/atoms/button'
import { Item, ItemContent, ItemDescription } from '@/atoms/item'
import { Popover, PopoverContent } from '@/atoms/popover'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { cn } from '@/lib/cn'
import type { AlertsBellModel } from '../lib/alertsBellModel'
import { portalAnchor } from '../lib/portalAnchor'

/**
 * There is one bell on a page — it lives in the shell's header — so one id is enough. The portal
 * renders into this anchor instead of `<body>` so the popover stays inside the shell it belongs
 * to: a consumer's `within(canvasElement)` still finds the rows, and `position: fixed` inside
 * resolves against the same containing block the phone header makes (`backdrop-filter` makes it
 * one).
 */
const ANCHOR_ID = 'alerts-pop-anchor'

/** The bell glyph on the ghost icon button; the unread bubble sits on its corner. */
const GLYPH = 'text-xl leading-none xl:text-2xl'

/**
 * The unread count, 16px on the strong destructive pair (the one `check-contrast` guards). It is
 * the molecule's own bubble until `Badge` grows a count size and the strong variant (requested):
 * the default Badge would cover a third of the 34px trigger.
 */
const BUBBLE = cn(
  'absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center px-1',
  'rounded-full bg-destructive text-xs leading-none font-semibold text-destructive-foreground tabular-nums',
)

/**
 * ≤480 the panel leaves the anchor and pins itself under the whole header, gutter to gutter: at
 * 420px a real seven-alert queue was sliced mid-row with 300px of empty page beneath it. Base UI
 * writes the anchored geometry into the positioner's `style` attribute, and an author `!important`
 * declaration is the one thing that outranks it.
 */
const POSITIONER = cn(
  'max-xs:fixed! max-xs:top-(--topbar-h)! max-xs:right-3! max-xs:left-3!',
  'max-xs:w-auto! max-xs:transform-none!',
)

/** The card of rows: 340 wide, scrolling past 420 tall; ≤480 it fills the header's width. */
const POPUP = cn(
  'w-[min(340px,calc(100vw-24px))] max-h-[min(420px,60dvh)] overflow-y-auto',
  'max-xs:w-auto max-xs:max-h-[calc(100dvh-var(--topbar-h)-24px)]',
)

/**
 * Alerts popover, on the `popover` atom. Base UI owns the disclosure wiring — `aria-expanded`,
 * `aria-controls`, Escape, the outside press and returning focus to the bell; the atom owns the
 * paint. The parent still owns the list, the open state and mark-as-read, and every dismissal
 * arrives back through `model.onOpenChange(false)`.
 *
 * A row is an `Item`, rendered as the link where the alert has somewhere to go: the painted row is
 * the promise, so the whole card taps. Unread is weight, the dot and the announced cue; the sky
 * tint returns when `Item` grows a tone (requested).
 */
export function AlertsBell({ model }: { model: AlertsBellModel }) {
  return (
    <div className="relative" data-slot="alerts-bell">
      <Popover open={model.open} onOpenChange={(open) => model.onOpenChange(open)}>
        {/* the primitive trigger in the ghost icon button's classes, not `<PopoverTrigger
            render={<Button />}>`: Button does not forward its ref under React 18 (requested) and
            Base UI needs the trigger element to anchor and to mark `aria-expanded`; the lint cannot
            read a cva call on an atom */}
        <PopoverPrimitive.Trigger
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
          data-slot="alerts-trigger"
          {...model.triggerProps}
        >
          <span className={GLYPH}>🔔</span>
          {model.unreadLabel && (
            <span className={BUBBLE} data-slot="bell-badge" {...model.badgeProps}>
              {model.unreadLabel}
            </span>
          )}
        </PopoverPrimitive.Trigger>
        <PortalAnchor id={ANCHOR_ID} />
        <PopoverContent
          container={portalAnchor(ANCHOR_ID)}
          align="end"
          /* a panel that flipped above a header would leave the viewport, so it never flips */
          collisionAvoidance={{ side: 'none', align: 'shift' }}
          /* opening a notification list must not move the caret: the popup is the next tab stop
             after the bell, exactly as the legacy panel was */
          initialFocus={false}
          positionerClassName={POSITIONER}
          className={POPUP}
          data-slot="alerts-pop"
          {...model.popupProps}
        >
          {model.empty && (
            <Item data-slot="alert-row">
              <ItemDescription>{model.emptyLabel}</ItemDescription>
            </Item>
          )}
          {model.rows.map((row) => (
            <Item
              key={row.id}
              render={row.linkProps ? <Link {...row.linkProps} /> : undefined}
              data-slot="alert-row"
              data-unread={row.unread || undefined}
            >
              <ItemContent>
                <span
                  className={cn(row.linkProps && 'group-hover/item:underline', row.unread && 'font-semibold')}
                  data-slot="alert-message"
                >
                  {row.statusLabel && (
                    <>
                      <span
                        className="mr-2 inline-block size-1.5 rounded-full bg-info-foreground align-middle"
                        data-slot="alert-dot"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{row.statusLabel} </span>
                    </>
                  )}
                  {row.message}
                </span>
                <time className="text-xs font-normal text-muted-foreground" {...row.timeProps}>
                  {row.timeLabel}
                </time>
              </ItemContent>
            </Item>
          ))}
          {model.overflowLabel && (
            <Item data-slot="alert-row">
              <ItemDescription>{model.overflowLabel}</ItemDescription>
            </Item>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
