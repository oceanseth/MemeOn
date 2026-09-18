import { describe, expect, it, vi } from 'vitest'
import { giftablePaper, giftableSilver, listedHolo } from '../../.storybook/fixtures'
import { giftDialogCopy as copy } from '../copy/giftDialog'
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
    onSharesBlur: vi.fn(),
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
    expect(model.searchInputProps['aria-label']).toBe(copy.search)
  })

  it('keeps the raw share text while typing and clamps only on blur and submit', () => {
    const onSharesChange = vi.fn()
    const onSharesBlur = vi.fn()
    const model = buildModel({ pick: { ...giftablePaper, myShares: 3 }, shares: 99, onSharesChange, onSharesBlur })

    expect(model.sharesInputProps.value).toBe(3)
    model.sharesInputProps.onChange?.({ target: { value: '' } } as never)
    expect(onSharesChange).toHaveBeenCalledWith('')
    model.sharesInputProps.onBlur?.({} as never)
    expect(onSharesBlur).toHaveBeenCalledOnce()

    const cleared = buildModel({ pick: { ...giftablePaper, myShares: 3 }, shares: 1, sharesInput: '' })
    expect(cleared.sharesInputProps.value).toBe('')

    expect(clampGiftShares('2.8', 3)).toBe(2)
    expect(clampGiftShares(-4, 3)).toBe(1)
    expect(clampGiftShares('not-a-number', 3)).toBe(1)
  })

  it('carries the tier ladder and the listed flag into every row', () => {
    const model = buildModel({ memes: [giftablePaper, { ...listedHolo, myShares: 100 }], pick: null })

    expect(model.rows[0]).toMatchObject({
      tierKey: 'paper',
      tierLabel: 'Paper',
      listed: false,
      sharesLabel: copy.sharesHeld(12),
    })
    expect(model.rows[1]).toMatchObject({ tierKey: 'holo', listed: true, listedLabel: copy.listed })
    expect(model.rows[0]?.imageProps).toMatchObject({ loading: 'lazy', decoding: 'async', width: 40, height: 40 })
  })

  it('keeps row selection, overlay dismissal, and submission eligibility in the model', () => {
    const onPick = vi.fn()
    const onClose = vi.fn()
    const onSubmit = vi.fn()
    const model = buildModel({ onPick, onClose, onSubmit })

    model.rows[1]?.buttonProps.onClick?.({} as never)
    // opening is the caller's business; only a dismissal is the model's
    model.onOpenChange(true)
    model.onOpenChange(false)
    model.submitButtonProps.onClick?.({} as never)

    expect(model.rows[0]?.selected).toBe(true)
    expect(model.rows[0]?.buttonProps['aria-pressed']).toBe(true)
    expect(onPick).toHaveBeenCalledWith(giftableSilver)
    expect(onClose).toHaveBeenCalledOnce()
    expect(model.id).toBe('gift-dialog')
    expect(model.titleId).toBe('gift-dialog-title')
    expect(model.hintId).toBe('gift-dialog-hint')
    expect(model.submitButtonProps.disabled).toBe(false)
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(buildModel({ pick: null }).submitButtonProps.disabled).toBe(true)
    expect(buildModel({ busy: true }).submitButtonProps.disabled).toBe(true)
  })

  it('gives an empty binder a way out: the ✕, cancel, and Escape', () => {
    const onClose = vi.fn()
    const model = buildModel({ onClose, memes: [] })

    expect(model.closeLabel).toBe(copy.close)
    // the ✕, the scrim and Escape are all one channel now
    model.onOpenChange(false)
    model.cancelButtonProps.onClick?.({} as never)

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('will not dismiss itself while a gift is in flight', () => {
    const onClose = vi.fn()
    const model = buildModel({ onClose, busy: true })

    model.cancelButtonProps.onClick?.({} as never)
    model.onOpenChange(false)

    expect(onClose).not.toHaveBeenCalled()
    expect(model.submitButtonProps['aria-busy']).toBe(true)
  })

  it('says so on every control while a gift is in flight, instead of looking operable', () => {
    const model = buildModel({ busy: true })

    expect(model.busy).toBe(true)
    expect(model.cancelButtonProps.disabled).toBe(true)
    expect(model.searchInputProps.disabled).toBe(true)
    expect(model.sharesInputProps.disabled).toBe(true)
    expect(model.rows.every((row) => row.buttonProps.disabled)).toBe(true)

    const idle = buildModel()
    expect(idle.busy).toBe(false)
    expect(idle.cancelButtonProps.disabled).toBe(false)
    expect(idle.searchInputProps.disabled).toBe(false)
    expect(idle.sharesInputProps.disabled).toBe(false)
    expect(idle.rows.every((row) => row.buttonProps.disabled)).toBe(false)
  })

  it('never dead-ends an empty binder', () => {
    expect(buildModel({ memes: [] }).emptyMessage).toBe(copy.emptyBinder)
    expect(buildModel({ query: 'zzz' }).emptyMessage).toBe(copy.emptySearch('zzz'))
  })

  it('records the opener, so the frame can hand focus back on the way out', () => {
    const opener = { focus: () => {}, isConnected: true } as unknown as HTMLElement
    vi.stubGlobal('document', { activeElement: opener, body: { nodeName: 'BODY' } })

    // no recipient is not a dialog at all: nothing is open, so nothing is recorded
    expect(buildModel({ recipient: null }).opener).toBeUndefined()
    // opened from state, with no Dialog.Trigger for Base UI to return to
    expect(buildModel().opener?.current).toBe(opener)
    // closed, the record goes with it: the next open belongs to whoever opens it next
    expect(buildModel({ open: false }).opener).toBeUndefined()
    vi.unstubAllGlobals()
  })
})
