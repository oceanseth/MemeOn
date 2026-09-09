import { describe, expect, it, vi } from 'vitest'
import { buildSortChipsModel } from './sortChipsModel'

describe('buildSortChipsModel', () => {
  it('marks and labels the active chip through supplied DOM props', () => {
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'asc', onChange: vi.fn() })
    const views = model.chips.find((chip) => chip.key === 'views')
    const newest = model.chips.find((chip) => chip.key === 'new')

    expect(views).toMatchObject({ active: true, arrow: '↑', directionLabel: 'ascending' })
    expect(views?.buttonProps['aria-pressed']).toBe(true)
    expect(views?.buttonProps['aria-label']).toBe('👁️ Views, ascending')
    expect(newest).toMatchObject({ active: false, arrow: null, directionLabel: null })
    expect(newest?.buttonProps['aria-pressed']).toBe(false)
    expect(newest?.buttonProps['aria-label']).toBe('Newest')
  })

  it('names the row as one group and leaves the chips live without a reason', () => {
    const model = buildSortChipsModel({ sortKey: 'new', dir: 'desc', onChange: vi.fn() })

    expect(model.groupProps).toEqual({ role: 'group', 'aria-label': 'Sort by' })
    expect(model.reason).toBeNull()
    expect(model.chips.every((chip) => chip.buttonProps.disabled === undefined)).toBe(true)
  })

  it('disables every chip and describes the row when ranking is unavailable', () => {
    const reason = 'Newest first for now.'
    const model = buildSortChipsModel({
      sortKey: 'new',
      dir: 'desc',
      onChange: vi.fn(),
      disabledReason: reason,
    })

    expect(model.reason).toBe(reason)
    expect(model.groupProps['aria-describedby']).toBe(model.reasonProps.id)
    expect(model.chips.every((chip) => chip.buttonProps.disabled)).toBe(true)
  })

  it('flips direction when the active chip is clicked', () => {
    const onChange = vi.fn()
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'desc', onChange })

    model.chips.find((chip) => chip.key === 'views')?.buttonProps.onClick({} as never)

    expect(onChange).toHaveBeenCalledWith('views', 'asc')
  })

  it('starts a newly selected key descending', () => {
    const onChange = vi.fn()
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'asc', onChange })

    model.chips.find((chip) => chip.key === 'value')?.buttonProps.onClick({} as never)

    expect(onChange).toHaveBeenCalledWith('value', 'desc')
  })
})
