import { Popover } from '@base-ui/react/popover'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import type { AlertsBellModel } from '../lib/alertsBellModel'

const FOCUS = cn(
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
)

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

/**
 * The bell is the bare emoji and nothing else. Every board draws it as a plain text node in the
 * header row — Feedback `HUU-0` (22×28) on `HSU-0`, Marketplace's `6WO-0` cluster on `6UR-0`, My
 * Binder `72L-0` (22×28) on `70L-0`, and the iPhone cluster `76J-0` (20×25) on `767-0` — while the
 * balance chip and the avatar beside it *are* raised boxes. So: no square, no fill, no shadow,
 * 20/25 below the shell breakpoint and 22/28 at 900+.
 *
 * The hit target still has to be 44: a centred transparent pseudo-element carries it without
 * taking any layout width, so the header cluster keeps the board's 12px rhythm and the focus ring
 * stays hugged to the glyph.
 */
const TRIGGER = cn(
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0',
  'text-[20px] leading-[25px] text-ink',
  '2xl:text-[22px] 2xl:leading-[28px]',
  'before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-x-1/2',
  'before:-translate-y-1/2 before:content-[""]',
  FOCUS,
)

/** Canvas on the error text colour: the pair `check-contrast` guards (WP1 deviation 2), 10px bold. */
const BADGE = cn(
  'absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center px-1',
  'rounded-pill bg-error-text text-[10px] leading-none font-bold text-canvas tabular-nums',
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
  'w-[min(340px,calc(100vw-24px))] max-h-[min(420px,60dvh)] overflow-y-auto [scrollbar-width:thin]',
  'rounded-card bg-surface p-2 shadow-pop',
  'max-xs:w-auto max-xs:max-h-[calc(100dvh-var(--topbar-h)-24px)]',
  FOCUS,
)

const ROW = cn(
  'block min-h-11 rounded-[18px] px-3 py-2.5 text-small leading-[18px] text-ink',
  '[transition:background_var(--dur-base)_ease] motion-reduce:transition-none',
)

/** Unread is the info tint plus weight; the dot in the same family is the shape cue. */
const UNREAD = 'bg-info-surface font-semibold'

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
                <div className={cn(ROW, 'text-ink-muted')} data-slot="alert-row">
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
                          className="mr-2 inline-block size-1.5 rounded-full bg-info-text align-middle"
                          data-slot="alert-dot"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{row.statusLabel} </span>
                      </>
                    )}
                    <span className="group-hover:underline" data-slot="alert-message">
                      {row.message}
                    </span>
                    <time className="mt-[3px] block text-micro font-normal text-ink-muted" {...row.timeProps}>
                      {row.timeLabel}
                    </time>
                  </>
                )
                return row.linkProps ? (
                  <Link
                    key={row.id}
                    className={cn(ROW, row.unread && UNREAD, 'group no-underline hover:bg-surface-raised', FOCUS)}
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
                <div className={cn(ROW, 'text-ink-muted')} data-slot="alert-row">
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
