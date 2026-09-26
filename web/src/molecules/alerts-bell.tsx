import { Link } from 'react-router-dom'
import { Badge } from '@/atoms/badge'
import { Button } from '@/atoms/button'
import { Item, ItemContent, ItemMedia } from '@/atoms/item'
import {
  headerPopoverPopupClassName,
  headerPopoverPositionerClassName,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/atoms/popover'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { cn } from '@/lib/cn'
import type { AlertsBellModel } from '../lib/alertsBellModel'
import { portalAnchor } from '../lib/portalAnchor'
import { Icon } from '@/atoms/icon'

/**
 * There is one bell on a page — it lives in the shell's header — so one id is enough. The portal
 * renders into this anchor instead of `<body>` so the popover stays inside the shell it belongs
 * to: a consumer's `within(canvasElement)` still finds the rows, and `position: fixed` inside
 * resolves against the same containing block the phone header makes (`backdrop-filter` makes it
 * one).
 */
const ANCHOR_ID = 'alerts-pop-anchor'

/** The bell glyph on the ghost icon button; the unread bubble sits on its corner. */
const GLYPH = cn('text-xl leading-none xl:text-2xl')

/** The unread count rides the trigger's corner; the disc itself is `Badge size="count"`. */
const BUBBLE = cn('absolute -top-1 -right-1')

/** Title band: the name, then the count of what is new in it. */
const HEAD = cn('flex items-baseline gap-2 px-3.5 pt-3 pb-2.5')
const COUNT = cn('text-sm font-medium text-muted-foreground')

/**
 * The list: hairline-separated rows, capped at ~7 of them so a full queue is a panel and not a
 * page. `min()` against the viewport keeps the cap honest on a short window, where the positioner's
 * available height is the smaller number.
 */
const LIST = cn(
  'flex max-h-(--alerts-max-h) flex-col overflow-y-auto scrollbar-thin',
  'border-t border-border divide-y divide-border',
)

/**
 * The row is the atom's `notice` size — flush, square, hairline-separated. The one thing left for
 * the list to say is that a row does not shrink: `LIST` is a capped flex column, and without this
 * the rows share the shortfall out between them and every stamp is sliced by the hairline below.
 */
const ROW = cn('shrink-0')

/** Two lines of message, then the stamp. `text-sm` is the list's step: 20 rows of `text-base` is a page. */
const MESSAGE = cn('line-clamp-2 text-sm text-foreground wrap-anywhere')
const TIME = cn('text-xs font-normal text-muted-foreground')

/** The unread dot keeps its own lane at the row's end, so a message never reflows when one is read. */
const DOT = cn('mt-1.5 size-2 shrink-0 self-start rounded-full bg-primary')

/** Nothing to show: a quiet disc, then the line that says which nothing this is. */
const EMPTY = cn('flex flex-col items-center gap-3 px-6 py-9 text-center')
const EMPTY_DISC = cn('grid size-11 place-items-center rounded-full')

/** The tail: what the list is not showing, set apart from the rows rather than faking one. */
const FOOT = cn(
  'm-0 border-t border-border px-3.5 py-2.5 text-center text-xs text-muted-foreground',
)

/**
 * Alerts popover, on the `popover` atom. Base UI owns the disclosure wiring — `aria-expanded`,
 * `aria-controls`, Escape, the outside press and returning focus to the bell; the atom owns the
 * paint. The parent still owns the list, the open state and mark-as-read, and every dismissal
 * arrives back through `model.onOpenChange(false)`.
 *
 * A row is an `Item`, rendered as the link where the alert has somewhere to go: the painted row is
 * the promise, so the whole card taps. Its mark is the emoji the server wrote at the head of the
 * message, lifted out of the sentence and into the media slot (`lib/alertsBellModel`) — one
 * column of text, one column of marks, and a two-line clamp that measures the message.
 */
export function AlertsBell({ model }: { model: AlertsBellModel }) {
  return (
    <div className="relative" data-slot="alerts-bell">
      <Popover open={model.open} onOpenChange={(open) => model.onOpenChange(open)}>
        <PopoverTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          data-slot="alerts-trigger"
          {...model.triggerProps}
        >
          <span className={GLYPH} aria-hidden="true">
            <Icon name="bell" size={20} />
          </span>
          {model.unreadLabel && (
            <Badge
              variant="destructive"
              size="count"
              className={BUBBLE}
              data-slot="bell-badge"
              {...model.badgeProps}
            >
              {model.unreadLabel}
            </Badge>
          )}
        </PopoverTrigger>
        <PortalAnchor id={ANCHOR_ID} />
        <PopoverContent
          container={portalAnchor(ANCHOR_ID)}
          align="end"
          /* a panel that flipped above a header would leave the viewport, so it never flips */
          collisionAvoidance={{ side: 'none', align: 'shift' }}
          /* opening a notification list must not move the caret: the popup is the next tab stop
             after the bell, exactly as the legacy panel was */
          initialFocus={false}
          // oxlint-disable-next-line shadcn/require-static-classes -- literal lives on the popover export
          positionerClassName={headerPopoverPositionerClassName}
          variant="panel"
          // oxlint-disable-next-line shadcn/require-static-classes -- literal lives on the popover export
          className={headerPopoverPopupClassName}
          data-slot="alerts-pop"
          {...model.popupProps}
        >
          <div className={HEAD} data-slot="alerts-head">
            {/* the popup's name is the model's `aria-label`; this is the same word, made visible */}
            <PopoverTitle data-slot="alerts-title">{model.title}</PopoverTitle>
            {model.unreadSummaryLabel && (
              <span className={COUNT} data-slot="alerts-count" aria-hidden="true">
                {model.unreadSummaryLabel}
              </span>
            )}
          </div>
          {model.empty ? (
            <div className={cn(EMPTY, 'border-t border-border')} data-slot="alerts-empty">
              <span
                className={cn(
                  EMPTY_DISC,
                  model.emptyTone === 'offline'
                    ? 'bg-warning text-warning-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
                aria-hidden="true"
              >
                <Icon name={model.emptyTone === 'offline' ? 'triangle-alert' : 'bell'} size={22} />
              </span>
              <p
                className="m-0 text-sm text-pretty text-muted-foreground"
                data-slot="alerts-empty-label"
              >
                {model.emptyLabel}
              </p>
            </div>
          ) : (
            <div className={LIST} data-slot="alerts-list">
              {model.rows.map((row) => (
                <Item
                  key={row.id}
                  render={row.linkProps ? <Link {...row.linkProps} /> : undefined}
                  size="notice"
                  tone={row.unread ? 'unread' : 'none'}
                  className={ROW}
                  data-slot="alert-row"
                  data-unread={row.unread || undefined}
                  title={row.fullMessage}
                >
                  <ItemMedia variant="disc" aria-hidden="true" data-slot="alert-mark">
                    {row.mark.kind === 'emoji' ? (
                      row.mark.emoji
                    ) : (
                      <Icon name={row.mark.icon} size={18} />
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <span
                      className={cn(
                        MESSAGE,
                        row.linkProps && 'group-hover/item:underline',
                        row.unread && 'font-semibold',
                      )}
                      data-slot="alert-message"
                    >
                      {row.statusLabel && <span className="sr-only">{row.statusLabel} </span>}
                      {row.message}
                    </span>
                    <time className={TIME} {...row.timeProps}>
                      {row.timeLabel}
                    </time>
                  </ItemContent>
                  {row.unread && <span className={DOT} data-slot="alert-dot" aria-hidden="true" />}
                </Item>
              ))}
            </div>
          )}
          {model.overflowLabel && (
            <p className={FOOT} data-slot="alerts-foot">
              {model.overflowLabel}
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
