import { Popover } from '@base-ui/react/popover'
import { Link } from 'react-router-dom'
import { buttonClasses } from '../atoms/Button'
import { cn } from '../lib/cn'
import type { AlertsBellModel } from '../lib/alertsBellModel'

const FOCUS = cn(
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
)

/**
 * There is one bell on a page — it lives in the topbar — so one id is enough. The portal renders
 * into this anchor instead of `<body>` so the popover stays inside the shell it belongs to: a
 * consumer's `within(canvasElement)` still finds the rows, and `position: fixed` inside resolves
 * against the same containing block the legacy popover used (the topbar owns one, because
 * `backdrop-filter` makes it one).
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

/** The emoji line box made the bell 44px beside a 36px Log out; 1.125 × 16px = 18px of content. */
const TRIGGER = cn(buttonClasses(), 'leading-[1.125]')

const BADGE = cn(
  'absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center px-1',
  'rounded-pill bg-danger text-[10px] leading-none font-bold text-text-inverse tabular-nums',
)

/**
 * ≤480 the panel leaves the anchor and pins itself under the whole topbar, gutter to gutter: at
 * 420px a real seven-alert queue was sliced mid-row with 300px of empty page beneath it. Base UI
 * writes the anchored geometry into the positioner's `style` attribute, and an author `!important`
 * declaration is the one thing that outranks it.
 */
const POSITIONER = cn(
  'max-xs:fixed! max-xs:top-(--topbar-h)! max-xs:right-3! max-xs:left-3!',
  'max-xs:w-auto! max-xs:transform-none!',
)

const POPUP = cn(
  'w-[min(340px,calc(100vw-24px))] max-h-[min(420px,60dvh)] overflow-y-auto [scrollbar-width:thin]',
  'rounded-card border border-border bg-bg-card p-2 shadow-pop',
  'max-xs:w-auto max-xs:max-h-[calc(100dvh-var(--topbar-h)-24px)]',
  FOCUS,
)

const ROW = cn('block rounded-control p-2.5 text-sm leading-[1.4] text-text', 'pointer-coarse:min-h-11')

/** Unread carries a shape cue (bar + weight); the tint is secondary. */
const UNREAD = cn(
  'relative font-semibold bg-(--state-unread-bg)',
  '[box-shadow:inset_2px_0_0_var(--color-accent)]',
)

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
        {/* display:contents, so an idle popover costs the toolbar no box and no flex gap */}
        <span id={ANCHOR_ID} className="contents" data-slot="alerts-anchor" />
        <Popover.Portal container={anchorContainer} className="contents">
          <Popover.Positioner
            side="bottom"
            align="end"
            /* the legacy panel sat 42px below the top of a 36px bell */
            sideOffset={6}
            collisionPadding={12}
            /* a panel that flipped above a topbar would leave the viewport, so it never flips */
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
                <div className={ROW} data-slot="alert-row">
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
                          className="mr-2 inline-block size-1.5 rounded-full bg-accent align-middle"
                          data-slot="alert-dot"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{row.statusLabel} </span>
                      </>
                    )}
                    <span className="text-accent group-hover:underline" data-slot="alert-message">
                      {row.message}
                    </span>
                    <time className="mt-[3px] block text-[11px] text-text-dim" {...row.timeProps}>
                      {row.timeLabel}
                    </time>
                  </>
                )
                return row.linkProps ? (
                  <Link
                    key={row.id}
                    className={cn(ROW, row.unread && UNREAD, 'group', FOCUS)}
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
                <div className={cn(ROW, 'text-text-dim')} data-slot="alert-row">
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
