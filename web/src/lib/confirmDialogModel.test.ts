import type { MouseEvent as ReactMouseEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { buildConfirmDialogModel } from './confirmDialogModel'

describe('buildConfirmDialogModel', () => {
  it('supplies overlay dismissal, dialog propagation and alert-dialog ARIA props', () => {
    const onCancel = vi.fn()
    const stopPropagation = vi.fn()
    const model = buildConfirmDialogModel({
      open: true,
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      onCancel,
    })

    model.overlayProps.onClick?.({} as ReactMouseEvent<HTMLDivElement>)
    model.dialogProps.onClick?.({ stopPropagation } as unknown as ReactMouseEvent<HTMLDivElement>)

    expect(onCancel).toHaveBeenCalledOnce()
    expect(stopPropagation).toHaveBeenCalledOnce()
    expect(model.dialogProps).toMatchObject({ role: 'alertdialog', 'aria-modal': true })
  })

  it('derives danger and busy labels and disables both actions', () => {
    const model = buildConfirmDialogModel({
      open: true,
      danger: true,
      busy: true,
      title: 'Delete forever?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete it',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    expect(model.title).toBe('⚠️ Delete forever?')
    expect(model.confirmLabel).toBe('Working…')
    expect(model.cancelButtonProps.disabled).toBe(true)
    expect(model.confirmButtonProps.disabled).toBe(true)
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
  })
})
