import type { DialogPopupProps } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/atoms/dialog'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'

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
 * The app's one modal frame, composed from the `dialog` atom. Base UI owns modality, the focus
 * trap, Escape, focus restoration and the scroll lock; the atom owns the paint (the modal card,
 * its scrim, the ≤720px bottom sheet); this file owns the app's contract — one `id`, model-driven
 * `open`, a title/description header, an optional ✕ that can be locked, and the two departures
 * from the atom's defaults below.
 *
 * Render it always and drive it from `open`; every dismissal (Escape, a press on the scrim, the ✕)
 * arrives as `onOpenChange(false)`, so a caller that is mid-request can simply refuse it.
 *
 *   <DialogFrame id="gift" open={open} onOpenChange={setOpen} title="Gift" close={{ label: 'Close' }}>
 *     …body, then a <DialogFooter> of actions…
 *   </DialogFrame>
 *
 * 1. The popup is portalled into a `PortalAnchor` at this component's own place in the tree rather
 *    than into `<body>`, so the dialog stays inside the screen it belongs to and a consumer's
 *    `within(canvasElement)` query still finds it.
 * 2. The content is mounted only while `open`, instead of being left to Base UI's own unmount.
 *    Base UI keeps a closed popup in the DOM for its exit animation, and this frame wants none —
 *    `open` is the whole truth, so a dismissal is gone in the same commit that reports it, exactly
 *    as `<dialog>.close()` was. Focus returns to whoever `finalFocus` names (`lib/dialogOpener`);
 *    without one, a same-commit removal beats Base UI's own restore and focus is left on `<main>`.
 *
 * The ✕ is the atom's: `close.disabled` reaches it as `closeDisabled`, so a locked dialog (a gift
 * in flight) keeps its exit greyed without the frame drawing its own button.
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

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <PortalAnchor id={anchorId} />
      {open && (
        <DialogContent
          container={portalAnchor(anchorId)}
          role={role}
          size={size}
          variant={danger ? 'danger' : 'default'}
          // every modal in the app drops to the floor under the 720px cut, so an on-screen keyboard
          // pushes the box instead of burying it
          sheet
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          showCloseButton={Boolean(close)}
          {...(close ? { closeLabel: close.label, closeDisabled: close.disabled } : {})}
          className={className}
        >
          <DialogHeader>
            <DialogTitle id={titleId ?? `${id}-title`} render={<h3 />}>
              {title}
            </DialogTitle>
            {description !== undefined && description !== null && (
              <DialogDescription
                id={descriptionId ?? `${id}-description`}
                render={descriptionAs === 'div' ? <div /> : <p />}
              >
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      )}
    </Dialog>
  )
}
