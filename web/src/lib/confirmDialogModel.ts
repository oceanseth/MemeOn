import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from 'react'

export interface BuildConfirmDialogModelInput {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export interface ConfirmDialogModel {
  open: boolean
  title: string
  message: ReactNode
  danger: boolean
  overlayProps: Pick<HTMLAttributes<HTMLDivElement>, 'onClick'>
  dialogProps: Pick<HTMLAttributes<HTMLDivElement>, 'onClick' | 'role' | 'aria-modal'>
  cancelLabel: string
  confirmLabel: string
  cancelButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
  confirmButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
}

export function buildConfirmDialogModel({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: BuildConfirmDialogModelInput): ConfirmDialogModel {
  const stopPropagation: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
  }

  return {
    open,
    title: danger ? `⚠️ ${title}` : title,
    message,
    danger,
    overlayProps: { onClick: onCancel },
    dialogProps: {
      onClick: stopPropagation,
      role: 'alertdialog',
      'aria-modal': true,
    },
    cancelLabel,
    confirmLabel: busy ? 'Working…' : confirmLabel,
    cancelButtonProps: {
      onClick: onCancel,
      disabled: busy,
    },
    confirmButtonProps: {
      onClick: onConfirm,
      disabled: busy,
    },
  }
}
