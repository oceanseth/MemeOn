import { describe, expect, it, vi } from 'vitest'
import { confirmDialogCopy as copy } from '../copy/confirmDialog'
import { buildConfirmDialogModel } from './confirmDialogModel'

describe('buildConfirmDialogModel', () => {
  it('names and describes the dialog and reports a dismissal once', () => {
    const onCancel = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      id: 'delete-meme',
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      onCancel,
    })

    // opening is the caller's business; only a dismissal is the model's
    model.onOpenChange(true)
    expect(onCancel).not.toHaveBeenCalled()

    model.onOpenChange(false)
    expect(onCancel).toHaveBeenCalledOnce()
    expect(model.id).toBe('delete-meme')
    expect(model.titleId).toBe('delete-meme-title')
    expect(model.messageId).toBe('delete-meme-message')
  })

  it('records the opener, so the frame can hand focus back on the way out', () => {
    const opener = { focus: () => {}, isConnected: true } as unknown as HTMLElement
    vi.stubGlobal('document', { activeElement: opener, body: { nodeName: 'BODY' } })
    const input = {
      id: 'restore-focus',
      title: 'Remove Pal?',
      message: 'They lose the thread.',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    }

    // opened from state, with no Dialog.Trigger for Base UI to return to
    expect(buildConfirmDialogModel({ ...input, open: true }).opener?.current).toBe(opener)
    // closed, the record goes with it: the next open belongs to whoever opens it next
    expect(buildConfirmDialogModel({ ...input, open: false }).opener).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('defaults its id, so an unnamed dialog still has stable aria ids', () => {
    const model = buildConfirmDialogModel({
      open: true,
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    expect(model.id).toBe('confirm')
    expect(model.titleId).toBe('confirm-title')
    expect(model.messageId).toBe('confirm-message')
  })

  it('is inert while busy: no dismissal at all, and no second confirm', () => {
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

    // Escape and the scrim both arrive here; in flight the dialog refuses both
    model.onOpenChange(false)

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
    expect(model.confirmLabel).toBe(copy.confirm)
    expect(model.cancelLabel).toBe('Cancel')
    expect(model.prompt).toBeNull()
  })

  it('builds a labelled prompt field that counts against its own cap', () => {
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

    expect(model.prompt).toMatchObject({ label: 'Why is this meme yours?', hint: 'Links help your case.', hintId: 'claim-meme-hint', counterLabel: '7/400' })
    expect(model.prompt?.textareaProps).toMatchObject({ value: 'my post', maxLength: 400, 'aria-describedby': 'claim-meme-hint' })

    model.prompt?.textareaProps.onChange?.({ target: { value: 'my post plus a link' } } as never)
    expect(onChange).toHaveBeenCalledWith('my post plus a link')

    // the counter reads the same cap the field enforces, even when the caller names neither
    const uncapped = buildConfirmDialogModel({
      open: true,
      title: 'Claim this meme?',
      message: 'Tell us why.',
      prompt: { label: 'Why?', value: '', onChange },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })
    expect(uncapped.prompt).toMatchObject({ counterLabel: '0/400', hint: null })
    expect(uncapped.prompt?.textareaProps.maxLength).toBe(400)
  })
})
