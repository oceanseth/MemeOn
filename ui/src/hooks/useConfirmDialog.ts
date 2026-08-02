import { useCallback, useMemo } from 'react'
import type { MouseEvent } from 'react'

/**
 * Mechanism for a confirmation modal: open gating, the danger flag, the busy
 * label swap, and scrim-vs-modal click routing. No styling — the caller
 * decides how danger and busy look.
 */
export function useConfirmDialog({
  open,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  // stop the scrim's dismiss from firing when the modal itself is clicked
  const stopPropagation = useCallback((e: MouseEvent) => e.stopPropagation(), [])

  return useMemo(
    () => ({
      isOpen: open,
      danger,
      busy,
      titlePrefix: danger ? '⚠️ ' : '',
      cancelLabel,
      confirmText: busy ? 'Working…' : confirmLabel,

      overlayProps: { onClick: onCancel },
      modalProps: {
        onClick: stopPropagation,
        role: 'alertdialog',
        'aria-modal': true,
      },
      cancelProps: { onClick: onCancel, disabled: busy },
      confirmProps: { onClick: onConfirm, disabled: busy },
    }),
    [open, danger, busy, cancelLabel, confirmLabel, onCancel, onConfirm, stopPropagation],
  )
}
