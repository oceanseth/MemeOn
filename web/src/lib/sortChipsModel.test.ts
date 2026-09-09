import { describe, expect, it, vi } from 'vitest'
import { buildSortChipsModel } from './sortChipsModel'

describe('buildSortChipsModel', () => {
  it('marks and labels the active chip through supplied DOM props', () => {
    const model = buildSortChipsModel({ sortKey: 'views', dir: 'asc', onChange: vi.fn() })
    const views = model.chips.find((chip) => chip.key === 'views')
    const newest = model.chips.find((chip) => chip.key === 'new')

    expect(views).toMatchObject({ active: true, arrow: '↑' })
    expect(views?.buttonProps['aria-pressed']).toBe(true)
    expect(newest).toMatchObject({ active: false, arrow: null })
    expect(newest?.buttonProps['aria-pressed']).toBe(false)
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
