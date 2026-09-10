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
  'rounded-card border border-border bg-bg-card p-6 text-text',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
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

/** A hairline of danger around the frame, over the same modal shadow. */
const DANGER =
  'border-[oklch(0.349_0.077_7.441)] ' +
  '[box-shadow:0_0_0_1px_color-mix(in_oklab,var(--color-danger)_25%,transparent),var(--shadow-modal)]'

const CLOSE = cn(
  'absolute top-2.5 right-2.5 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center',
  'rounded-control border-0 bg-transparent p-0 text-text-dim',
  '[transition:color_var(--dur-base)_ease,background_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:bg-bg-raised hover:text-text',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
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
      className="m-0 mb-1.5 text-[22px] leading-[1.2] font-bold"
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
            className={cn(POPUP, SIZE[size], danger ? DANGER : 'shadow-modal', className)}
            data-slot="dialog"
          >
            {close ? (
              <div className="flex items-center justify-between gap-3 pr-11" data-slot="dialog-head">
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
                className={cn('m-0 text-sm leading-[1.55] text-text-dim', descriptionClassName)}
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
