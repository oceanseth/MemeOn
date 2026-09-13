import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { confirmDialogCopy as copy } from '../copy/confirmDialog'
import { trackDialogOpener, type DialogOpenerRef } from './dialogOpener'

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
  /** `used/limit`, so a 400-character cap is visible before it bites */
  counterLabel: string
  textareaProps: Pick<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'placeholder' | 'maxLength' | 'rows' | 'onChange' | 'disabled' | 'aria-describedby'
  >
}

export interface ConfirmDialogModel {
  open: boolean
  /**
   * Whatever was focused when the dialog opened. The frame hands focus back to it on the way out,
   * because a dialog opened from state has no trigger for Base UI to return to on its own.
   */
  opener?: DialogOpenerRef | undefined
  /** unique per dialog on the page; the frame builds its portal anchor from it */
  id: string
  title: string
  titleId: string
  message: ReactNode
  messageId: string
  danger: boolean
  busy: boolean
  prompt: ConfirmPromptModel | null
  /**
   * The single dismissal channel Base UI reports into: Escape and a press on the scrim both arrive
   * as `false`. In flight it is a no-op, so the request owns the dialog until it answers.
   */
  onOpenChange: (open: boolean) => void
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
  confirmLabel = copy.confirm,
  cancelLabel = copy.cancel,
  danger = false,
  busy = false,
  prompt,
  onConfirm,
  onCancel,
}: BuildConfirmDialogModelInput): ConfirmDialogModel {
  const titleId = `${id}-title`
  const messageId = `${id}-message`
  const hintId = `${id}-hint`
  const maxLength = prompt?.maxLength ?? 400

  return {
    open,
    // read during the build that first reports open, while the opener still holds focus
    opener: trackDialogOpener(id, open),
    id,
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
        counterLabel: `${prompt.value.length}/${maxLength}`,
        textareaProps: {
          value: prompt.value,
          placeholder: prompt.placeholder,
          maxLength,
          rows: 3,
          disabled: busy,
          'aria-describedby': prompt.hint ? hintId : undefined,
          onChange: (event) => prompt.onChange(event.target.value),
        },
      }
      : null,
    // Escape and the scrim are Base UI's to detect; whether they are obeyed is this model's call,
    // and a request in flight refuses, so the DOM and the model can never disagree about being open.
    onOpenChange: (nextOpen) => {
      if (!nextOpen && !busy) onCancel()
    },
    cancelLabel,
    confirmLabel: busy ? copy.busy : confirmLabel,
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
