import type {
  ButtonHTMLAttributes,
  DialogHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'

export interface ConfirmPromptInput {
  label: string
  value: string
  placeholder?: string
  maxLength?: number
  hint?: string | null
  onChange: (value: string) => void
}

export interface BuildConfirmDialogModelInput {
  open: boolean
  /** unique per dialog on the page; ids for aria-labelledby / aria-describedby derive from it */
  id?: string
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  prompt?: ConfirmPromptInput | undefined
  onConfirm: () => void
  onCancel: () => void
}

export interface ConfirmPromptModel {
  label: string
  hint: string | null
  hintId: string
  textareaProps: Pick<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'placeholder' | 'maxLength' | 'rows' | 'onChange' | 'disabled' | 'aria-describedby'
  >
}

export interface ConfirmDialogModel {
  open: boolean
  title: string
  titleId: string
  message: ReactNode
  messageId: string
  danger: boolean
  busy: boolean
  prompt: ConfirmPromptModel | null
  /**
   * Spread onto the native `<dialog>`: the platform supplies focus containment, the top layer and
   * Escape; these props supply the name, the description, the busy guard and backdrop dismissal.
   */
  dialogProps: Pick<
    DialogHTMLAttributes<HTMLDialogElement>,
    'role' | 'aria-labelledby' | 'aria-describedby' | 'onClick' | 'onCancel' | 'onClose'
  >
  cancelLabel: string
  confirmLabel: string
  cancelButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
  /** busy is announced with aria-busy/aria-disabled, never `disabled`: an in-flight label must stay readable */
  confirmButtonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-disabled' | 'aria-busy'
  >
}

export function buildConfirmDialogModel({
  open,
  id = 'confirm',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  prompt,
  onConfirm,
  onCancel,
}: BuildConfirmDialogModelInput): ConfirmDialogModel {
  const titleId = `${id}-title`
  const messageId = `${id}-message`
  const hintId = `${id}-hint`
  const dismiss = () => {
    if (!busy) onCancel()
  }

  return {
    open,
    title: danger ? `⚠️ ${title}` : title,
    titleId,
    message,
    messageId,
    danger,
    busy,
    prompt: prompt
      ? {
        label: prompt.label,
        hint: prompt.hint ?? null,
        hintId,
        textareaProps: {
          value: prompt.value,
          placeholder: prompt.placeholder,
          maxLength: prompt.maxLength ?? 400,
          rows: 3,
          disabled: busy,
          'aria-describedby': prompt.hint ? hintId : undefined,
          onChange: (event) => prompt.onChange(event.target.value),
        },
      }
      : null,
    dialogProps: {
      role: 'alertdialog',
      'aria-labelledby': titleId,
      'aria-describedby': messageId,
      // backdrop (and only the backdrop) dismisses, and never while the request is in flight
      onClick: (event) => {
        if (event.target === event.currentTarget) dismiss()
      },
      // Escape while a request is in flight is refused; otherwise the platform closes and onClose
      // reports it back, so the DOM and the model can never disagree about being open.
      onCancel: (event) => {
        if (busy) event.preventDefault()
      },
      onClose: (event) => {
        // `close()` fires this asynchronously, so our own close can land after the dialog has
        // already been reopened; the element, not the stale event, says whether it is still shut.
        if (event.currentTarget?.open) return
        if (open && !busy) onCancel()
      },
    },
    cancelLabel,
    confirmLabel: busy ? 'Working…' : confirmLabel,
    cancelButtonProps: {
      onClick: busy ? undefined : onCancel,
      disabled: busy,
    },
    confirmButtonProps: {
      onClick: busy ? undefined : onConfirm,
      'aria-disabled': busy || undefined,
      'aria-busy': busy || undefined,
    },
  }
}
