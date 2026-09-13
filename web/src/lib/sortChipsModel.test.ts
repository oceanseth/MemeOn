import { describe, expect, it, vi } from 'vitest'
import { sortChipsCopy as copy } from '../copy/sortChips'
import { buildSortChipsModel } from './sortChipsModel'

describe('buildSortChipsModel', () => {
  it('marks and labels the selected chip as state the row can render', () => {
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'asc', onChange: vi.fn() })
    const views = model.chips.find((chip) => chip.key === 'views')
    const newest = model.chips.find((chip) => chip.key === 'new')

    expect(model.selected).toBe('views')
    expect(model.direction).toBe('asc')
    expect(views).toMatchObject({
      selected: true,
      direction: 'asc',
      arrow: '↑',
      directionLabel: 'ascending',
    })
    expect(views?.buttonProps['aria-label']).toBe('👁️ Views, ascending')
    expect(newest).toMatchObject({ selected: false, direction: null, arrow: null, directionLabel: null })
    expect(newest?.buttonProps['aria-label']).toBe('Newest')
  })

  it('names the row as one group and leaves the chips live without a reason', () => {
    const model = buildSortChipsModel({ sortKey: 'new', dir: 'desc', onChange: vi.fn() })

    expect(model.groupProps).toEqual({ role: 'group', 'aria-label': copy.group })
    expect(model.reason).toBeNull()
    expect(model.disabled).toBe(false)
  })

  it('disables the row and describes it when ranking is unavailable', () => {
    const reason = 'Newest first for now.'
    const model = buildSortChipsModel({
      sortKey: 'new',
      dir: 'desc',
      onChange: vi.fn(),
      disabledReason: reason,
    })

    expect(model.reason).toBe(reason)
    expect(model.groupProps['aria-describedby']).toBe(model.reasonProps.id)
    expect(model.disabled).toBe(true)
  })

  it('flips direction when the selected chip is pressed again', () => {
    const onChange = vi.fn()
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'desc', onChange })

    model.flip()

    expect(onChange).toHaveBeenCalledWith('views', 'asc')
  })

  it('starts a newly selected key descending', () => {
    const onChange = vi.fn()
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'asc', onChange })

    model.select('value')

    expect(onChange).toHaveBeenCalledWith('value', 'desc')
  })
})
