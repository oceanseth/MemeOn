import { Dialog } from '@base-ui/react/dialog'
import type { DialogPopupProps } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * A ref-shaped container for `Dialog.Portal`. Base UI reads `.current` in a layout effect, after the
 * anchor `<span>` is in the DOM, so a getter over `getElementById` needs no ref — and no hook, which
 * a molecule is not allowed to call.
 */
const anchorContainer = (anchorId: string) => ({
  get current(): HTMLElement | null {
    return document.getElementById(anchorId)
  },
})

/** `margin: auto` + `inset: 0` is how a native modal `<dialog>` centres itself; `mb-0` drops it to the floor. */
const POPUP = cn(
  'fixed inset-0 z-(--z-modal) m-auto h-fit box-border overflow-y-auto [scrollbar-width:thin]',
  'max-h-[min(86dvh,86vh)] max-w-[calc(100vw-24px)]',
  // the modal card: radius 25, 24 of padding, the surface colour, no border — the shadow is the edge
  'rounded-card border-0 bg-surface p-6 text-ink shadow-modal',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4 forced-colors:focus-visible:outline-[Highlight]',
  // ≤720px: a bottom sheet, so an on-screen keyboard pushes the dialog instead of burying it
  'max-lg:mb-0 max-lg:w-full max-lg:max-w-none max-lg:rounded-b-none',
  'max-lg:pb-[max(24px,env(safe-area-inset-bottom))]',
)

const SIZE = {
  /** the confirm frame */
  sm: 'w-[min(440px,calc(100vw-24px))]',
  /** every other modal */
  md: 'w-[min(640px,calc(100vw-24px))]',
}

/**
 * The danger frame: a 2px ring drawn inside the card, so the box never grows and the modal shadow
 * underneath it is untouched (Tailwind composes `inset-ring` and `shadow` into the one property).
 */
const DANGER = 'inset-ring-2 inset-ring-error-text'

/** The ✕ is a 40px neutral raised square — the design has no drawn x, and the glyph is the button. */
const CLOSE = cn(
  'absolute top-6 right-6 inline-flex size-10 pointer-coarse:size-11 cursor-pointer items-center justify-center',
  'rounded-[13px] border-0 bg-surface-raised p-0 text-label text-ink shadow-raised',
  '[transition:transform_var(--dur-fast)_ease,box-shadow_var(--dur-base)_ease] motion-reduce:transition-none',
  '[&:not(:disabled):active]:translate-y-px [&:not(:disabled):active]:shadow-pressed',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4 forced-colors:focus-visible:outline-[Highlight]',
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
)

export interface DialogFrameCloseModel {
  /** accessible name for the ✕; it is the only exit some dialogs offer a screen reader */
  label: string
  disabled?: boolean | undefined
}

export interface DialogFrameProps {
  open: boolean
  /**
   * Every dismissal Base UI recognises lands here with `false` — Escape, a press on the scrim and
   * the ✕ alike. Ignore it to refuse (an in-flight request keeps its dialog).
   */
  onOpenChange: (open: boolean) => void
  /** unique per dialog on the page; the portal anchor and the default ids derive from it */
  id: string
  title: ReactNode
  /** defaults to `${id}-title`; pass the model's own id to keep it stable */
  titleId?: string | undefined
  description?: ReactNode
  /** defaults to `${id}-description` */
  descriptionId?: string | undefined
  /** `div` for a description that carries block content — a `<p>` inside a `<p>` is not markup */
  descriptionAs?: 'p' | 'div' | undefined
  descriptionClassName?: string | undefined
  /** `alertdialog` for a decision the user cannot walk away from */
  role?: 'dialog' | 'alertdialog' | undefined
  size?: 'sm' | 'md' | undefined
  /** the danger frame; the role is separate, because a plain confirm is an alertdialog too */
  danger?: boolean | undefined
  /** renders the ✕ exit in the title row; omit when the action row is the only way out */
  close?: DialogFrameCloseModel | undefined
  /** Base UI focuses the first tabbable element by default; override when that is not the task */
  initialFocus?: DialogPopupProps['initialFocus'] | undefined
  /**
   * Where focus lands on the way out. Pass the opener a model recorded when it turned open: these
   * dialogs have no `Dialog.Trigger`, and without an explicit target a press on the scrim leaves
   * focus wherever the browser dropped it when the popup was removed.
   */
  finalFocus?: DialogPopupProps['finalFocus'] | undefined
  className?: string | undefined
  children?: ReactNode
}

/**
 * The app's one modal frame, on Base UI's Dialog. Base UI owns modality, the focus trap, Escape,
 * focus restoration to the opener and the scroll lock; this file owns the paint — the legacy
 * modal box, its scrim, its title/close row and the ≤720px bottom sheet.
 *
 * Render it always and drive it from `open`; every dismissal (Escape, a press on the scrim, the ✕)
 * arrives as `onOpenChange(false)`, so a caller that is mid-request can simply refuse it.
 *
 *   <DialogFrame id="gift" open={open} onOpenChange={setOpen} title="Gift" close={{ label: 'Close' }}>
 *     …body and action row…
 *   </DialogFrame>
 *
 * Two departures from the Base UI defaults, both deliberate:
 *
 * 1. The popup is portalled into an anchor at this component's own place in the tree rather than
 *    into `<body>`, so the dialog stays inside the screen it belongs to and a consumer's
 *    `within(canvasElement)` query still finds it.
 * 2. The portal is gated on `open` instead of being left to Base UI's own unmount. Base UI keeps a
 *    closed popup in the DOM for the frame an exit animation would have used, and this frame has
 *    none — `open` is the whole truth, so a dismissal is gone in the same commit that reports it,
 *    exactly as `<dialog>.close()` was. Focus returns to whoever `finalFocus` names; without one,
 *    a same-commit removal beats Base UI's own restore and focus is left on the `<main>` landmark.
 */
export function DialogFrame({
  open,
  onOpenChange,
  id,
  title,
  titleId,
  description,
  descriptionId,
  descriptionAs = 'p',
  descriptionClassName,
  role = 'dialog',
  size = 'md',
  danger = false,
  close,
  initialFocus,
  finalFocus,
  className,
  children,
}: DialogFrameProps) {
  const anchorId = `${id}-dialog-anchor`
  const heading = (
    <Dialog.Title
      id={titleId ?? `${id}-title`}
      render={<h3 />}
      /* 23/29 display on `--tracking-title`, as every dialog heading on the Feedback board is
         drawn (`HVL-0` Gift shares, `HVU-0` Remove friend) */
      className="m-0 mb-1.5 text-title tracking-title"
      data-slot="dialog-title"
    >
      {title}
    </Dialog.Title>
  )

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      {/* display:contents, so an idle frame costs its screen no box and no flex gap */}
      <span id={anchorId} className="contents" data-slot="dialog-anchor" />
      {open && (
        <Dialog.Portal container={anchorContainer(anchorId)} className="contents">
          <Dialog.Backdrop
            className="fixed inset-0 z-(--z-modal) bg-scrim backdrop-blur-[6px]"
            data-slot="dialog-backdrop"
          />
          <Dialog.Popup
            role={role}
            // Base UI leaves it off, and a screen reader that honours it needs it on both roles
            aria-modal="true"
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            className={cn(POPUP, SIZE[size], danger && DANGER, className)}
            data-slot="dialog"
          >
            {close ? (
              <div className="flex items-center justify-between gap-3 pr-12" data-slot="dialog-head">
                {heading}
                <Dialog.Close
                  aria-label={close.label}
                  disabled={close.disabled}
                  className={CLOSE}
                  data-slot="dialog-close"
                >
                  <span aria-hidden="true">✕</span>
                </Dialog.Close>
              </div>
            ) : (
              heading
            )}
            {description !== undefined && description !== null && (
              <Dialog.Description
                id={descriptionId ?? `${id}-description`}
                render={descriptionAs === 'div' ? <div /> : <p />}
                /* 15/19 on ink-muted: every description on the Feedback board is the label step,
                   not body — `HVM-0` (Gift shares), `HVV-0` (Remove friend) and the five state
                   specimens beside them all measure 15px/19px. */
                className={cn('m-0 text-label text-ink-muted', descriptionClassName)}
                data-slot="dialog-description"
              >
                {description}
              </Dialog.Description>
            )}
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  )
}
