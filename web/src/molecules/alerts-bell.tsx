import { Popover } from '@base-ui/react/popover'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import type { AlertsBellModel } from '../lib/alertsBellModel'

const FOCUS = 'focus-ring'

/**
 * There is one bell on a page — it lives in the shell's header — so one id is enough. The portal
 * renders into this anchor instead of `<body>` so the popover stays inside the shell it belongs
 * to: a consumer's `within(canvasElement)` still finds the rows, and `position: fixed` inside
 * resolves against the same containing block the phone header makes (`backdrop-filter` makes it
 * one).
 */
const ANCHOR_ID = 'alerts-pop-anchor'

/**
 * A ref-shaped container for `Popover.Portal`. Base UI reads `.current` in a layout effect, after
 * the anchor `<span>` is in the DOM, so a getter needs no ref — and no hook, which a molecule is
 * not allowed to call.
 */
const anchorContainer = {
  get current(): HTMLElement | null {
    return document.getElementById(ANCHOR_ID)
  },
}

/** Bare emoji trigger — no raised chrome. Pseudo-element carries the 44px hit target. */
const TRIGGER = cn(
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0',
  'text-xl leading-none text-foreground',
  'xl:text-2xl',
  'hit-44',
  FOCUS,
)

/** Canvas on the error text colour: the pair `check-contrast` guards (WP1 deviation 2), 10px bold. */
const BADGE = cn(
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

/** A raised card of rows. */
const POPUP = cn(
  'w-[min(340px,calc(100vw-24px))] max-h-[min(420px,60dvh)] overflow-y-auto scrollbar-thin',
  'rounded-lg material-pop p-2',
  'max-xs:w-auto max-xs:max-h-[calc(100dvh-var(--topbar-h)-24px)]',
  FOCUS,
)

const ROW = cn(
  'block min-h-hit rounded-md px-3 py-2.5 text-sm text-foreground',
  'transition-tint',
)

/** Unread is the info tint plus weight; the dot in the same family is the shape cue. */
const UNREAD = 'bg-info font-semibold'

/**
 * Alerts popover, on Base UI's Popover. Base UI owns the disclosure wiring — `aria-expanded`,
 * `aria-controls`, Escape, the outside press and returning focus to the bell; this file owns the
 * paint. The parent still owns the list, the open state and mark-as-read, and every dismissal
 * arrives back through `model.onOpenChange(false)`.
 */
export function AlertsBell({ model }: { model: AlertsBellModel }) {
  return (
    <div className="relative" data-slot="alerts-bell">
      <Popover.Root open={model.open} onOpenChange={(open) => model.onOpenChange(open)}>
        <Popover.Trigger className={TRIGGER} data-slot="alerts-trigger" {...model.triggerProps}>
          🔔
          {model.unreadLabel && (
            <span className={BADGE} data-slot="bell-badge" {...model.badgeProps}>
              {model.unreadLabel}
            </span>
          )}
        </Popover.Trigger>
        {/* display:contents, so an idle popover costs the header no box and no flex gap */}
        <span id={ANCHOR_ID} className="contents" data-slot="alerts-anchor" />
        <Popover.Portal container={anchorContainer} className="contents">
          <Popover.Positioner
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={12}
            /* a panel that flipped above a header would leave the viewport, so it never flips */
            collisionAvoidance={{ side: 'none', align: 'shift' }}
            className={POSITIONER}
          >
            <Popover.Popup
              /* opening a notification list must not move the caret: the popup is the next tab
                 stop after the bell, exactly as the legacy panel was */
              initialFocus={false}
              className={POPUP}
              data-slot="alerts-pop"
              {...model.popupProps}
            >
              {model.empty && (
                <div className={cn(ROW, 'text-muted-foreground')} data-slot="alert-row">
                  {model.emptyLabel}
                </div>
              )}
              {model.rows.map((row) => {
                // the painted row is the promise, so the row itself is the link: the whole card taps
                const body = (
                  <>
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
                    <span className="group-hover:underline" data-slot="alert-message">
                      {row.message}
                    </span>
                    <time className="mt-1 block text-xs font-normal text-muted-foreground" {...row.timeProps}>
                      {row.timeLabel}
                    </time>
                  </>
                )
                return row.linkProps ? (
                  <Link
                    key={row.id}
                    className={cn(ROW, row.unread && UNREAD, 'group no-underline hover:bg-accent', FOCUS)}
                    data-slot="alert-row"
                    data-unread={row.unread || undefined}
                    {...row.linkProps}
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    key={row.id}
                    className={cn(ROW, row.unread && UNREAD)}
                    data-slot="alert-row"
                    data-unread={row.unread || undefined}
                  >
                    {body}
                  </div>
                )
              })}
              {model.overflowLabel && (
                <div className={cn(ROW, 'text-muted-foreground')} data-slot="alert-row">
                  {model.overflowLabel}
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
