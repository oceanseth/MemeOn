import type { MouseEvent as ReactMouseEvent, SyntheticEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { buildConfirmDialogModel } from './confirmDialogModel'

const backdropClick = (dialog: object) => ({ target: dialog, currentTarget: dialog }) as unknown as ReactMouseEvent<HTMLDialogElement>
const contentClick = (dialog: object) => ({ target: {}, currentTarget: dialog }) as unknown as ReactMouseEvent<HTMLDialogElement>

describe('buildConfirmDialogModel', () => {
  it('names and describes the dialog and dismisses only from the backdrop', () => {
    const onCancel = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      id: 'delete-meme',
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      onCancel,
    })
    const dialog = {}

    model.dialogProps.onClick?.(contentClick(dialog))
    expect(onCancel).not.toHaveBeenCalled()

    model.dialogProps.onClick?.(backdropClick(dialog))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(model.dialogProps).toMatchObject({
      role: 'alertdialog',
      'aria-labelledby': 'delete-meme-title',
      'aria-describedby': 'delete-meme-message',
    })
    expect(model.titleId).toBe('delete-meme-title')
    expect(model.messageId).toBe('delete-meme-message')
  })

  it('lets the platform close on Escape and reports it back once', () => {
    const onCancel = vi.fn()
    const preventDefault = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      onCancel,
    })

    model.dialogProps.onCancel?.({ preventDefault } as unknown as SyntheticEvent<HTMLDialogElement>)
    model.dialogProps.onClose?.({} as unknown as SyntheticEvent<HTMLDialogElement>)

    expect(preventDefault).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledOnce()

    // the close that follows a model-driven dismissal is not reported a second time
    const closed = buildConfirmDialogModel({
      open: false,
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      onCancel,
    })
    closed.dialogProps.onClose?.({} as unknown as SyntheticEvent<HTMLDialogElement>)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('is inert while busy: no backdrop dismissal, no Escape, no second confirm', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      danger: true,
      busy: true,
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete it',
      onConfirm,
      onCancel,
    })
    const dialog = {}

    const preventDefault = vi.fn()
    model.dialogProps.onClick?.(backdropClick(dialog))
    model.dialogProps.onCancel?.({ preventDefault } as unknown as SyntheticEvent<HTMLDialogElement>)
    model.dialogProps.onClose?.({} as unknown as SyntheticEvent<HTMLDialogElement>)

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
    expect(model.title).toBe('⚠️ Delete forever?')
    expect(model.confirmLabel).toBe('Working…')
    expect(model.busy).toBe(true)
    expect(model.cancelButtonProps.disabled).toBe(true)
    expect(model.cancelButtonProps.onClick).toBeUndefined()
    // busy is announced, not disabled: the label of an irreversible action stays readable
    expect(model.confirmButtonProps).toMatchObject({ 'aria-busy': true, 'aria-disabled': true })
    expect(model.confirmButtonProps.onClick).toBeUndefined()
  })

  it('binds supplied confirm and cancel actions to button props', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      title: 'Continue?',
      message: 'Ready.',
      onConfirm,
      onCancel,
    })

    model.confirmButtonProps.onClick?.({} as never)
    model.cancelButtonProps.onClick?.({} as never)

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
    expect(model.confirmLabel).toBe('Confirm')
    expect(model.cancelLabel).toBe('Cancel')
    expect(model.prompt).toBeNull()
  })

  it('builds a labelled prompt field that reports its own value', () => {
    const onChange = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      id: 'claim-meme',
      title: 'Claim this meme?',
      message: 'Tell us why.',
      prompt: { label: 'Why is this meme yours?', value: 'my post', maxLength: 400, hint: 'Links help your case.', onChange },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    expect(model.prompt).toMatchObject({ label: 'Why is this meme yours?', hint: 'Links help your case.', hintId: 'claim-meme-hint' })
    expect(model.prompt?.textareaProps).toMatchObject({ value: 'my post', maxLength: 400, 'aria-describedby': 'claim-meme-hint' })

    model.prompt?.textareaProps.onChange?.({ target: { value: 'my post plus a link' } } as never)
    expect(onChange).toHaveBeenCalledWith('my post plus a link')
  })
})
