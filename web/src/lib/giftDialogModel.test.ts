import { describe, expect, it, vi } from 'vitest'
import { giftablePaper, giftableSilver } from '../../.storybook/fixtures'
import { buildGiftDialogModel, clampGiftShares } from './giftDialogModel'

const recipient = { sub: 'pal-sub', name: 'Pal' }

function buildModel(overrides: Partial<Parameters<typeof buildGiftDialogModel>[0]> = {}) {
  return buildGiftDialogModel({
    open: true,
    recipient,
    memes: [giftablePaper, giftableSilver],
    query: '',
    pick: giftablePaper,
    shares: 1,
    busy: false,
    error: null,
    onClose: vi.fn(),
    onQueryChange: vi.fn(),
    onPick: vi.fn(),
    onSharesChange: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  })
}

describe('gift dialog model', () => {
  it('filters rows through the supplied search input props', () => {
    const onQueryChange = vi.fn()
    const model = buildModel({ query: ' SILVER ', onQueryChange })

    expect(model.rows.map((row) => row.id)).toEqual([giftableSilver.id])
    model.searchInputProps.onChange?.({ target: { value: 'paper' } } as never)
    expect(onQueryChange).toHaveBeenCalledWith('paper')
  })

  it('normalizes share input to the selected holding floor and ceiling', () => {
    const onSharesChange = vi.fn()
    const model = buildModel({ pick: { ...giftablePaper, myShares: 3 }, shares: 99, onSharesChange })

    expect(model.sharesInputProps.value).toBe(3)
    model.sharesInputProps.onChange?.({ target: { value: '2.8' } } as never)
    model.sharesInputProps.onChange?.({ target: { value: '' } } as never)
    expect(onSharesChange).toHaveBeenNthCalledWith(1, 2)
    expect(onSharesChange).toHaveBeenNthCalledWith(2, 1)
    expect(clampGiftShares(-4, 3)).toBe(1)
    expect(clampGiftShares('not-a-number', 3)).toBe(1)
  })

  it('keeps row selection, overlay dismissal, and submission eligibility in the model', () => {
    const onPick = vi.fn()
    const onClose = vi.fn()
    const onSubmit = vi.fn()
    const model = buildModel({ onPick, onClose, onSubmit })
    const event = { stopPropagation: vi.fn() }

    model.rows[1]?.buttonProps.onClick?.({} as never)
    model.overlayProps.onClick?.({} as never)
    model.dialogProps.onClick?.(event as never)
    model.submitButtonProps.onClick?.({} as never)

    expect(model.rows[0]?.selected).toBe(true)
    expect(onPick).toHaveBeenCalledWith(giftableSilver)
    expect(onClose).toHaveBeenCalledOnce()
    expect(event.stopPropagation).toHaveBeenCalledOnce()
    expect(model.dialogProps).toMatchObject({ role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'gift-dialog-title' })
    expect(model.submitButtonProps.disabled).toBe(false)
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(buildModel({ pick: null }).submitButtonProps.disabled).toBe(true)
    expect(buildModel({ busy: true }).submitButtonProps.disabled).toBe(true)
  })
})
