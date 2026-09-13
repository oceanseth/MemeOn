import { describe, expect, it, vi } from 'vitest'
import { profileCopy as copy } from '../copy/profile'
import { buildProfileTabProps } from './useProfileScreen'

describe('profile tab model props', () => {
  it('exposes selected state and sends the selected tab through supplied button props', () => {
    const onTabChange = vi.fn()
    const model = buildProfileTabProps('created', 3, onTabChange)

    expect(model.createdTabButtonProps['aria-pressed']).toBe(true)
    expect(model.binderTabButtonProps['aria-pressed']).toBe(false)
    model.binderTabButtonProps.onClick?.({} as never)

    expect(onTabChange).toHaveBeenCalledWith('binder')
  })

  it('points both tabs at the grid they swap and names it for the current tab', () => {
    const created = buildProfileTabProps('created', 3, vi.fn())
    const binder = buildProfileTabProps('binder', 1, vi.fn())

    expect(created.createdTabButtonProps['aria-controls']).toBe(created.gridProps.id)
    expect(created.binderTabButtonProps['aria-controls']).toBe(created.gridProps.id)
    expect(created.gridProps['aria-label']).toBe(copy.grid.label(copy.tabs.created, 3))
    expect(binder.gridProps['aria-label']).toBe(copy.grid.label(copy.tabs.binder, 1))
  })
})
