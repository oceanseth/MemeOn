import { describe, expect, it, vi } from 'vitest'
import { profileCopy as copy } from '../copy/profile'
import { PROFILE_CARDS_ID, buildProfileTabLabels, buildProfileTabProps } from './useProfileScreen'

describe('profile tab model props', () => {
  it('names the selected tab and sends the picked one back', () => {
    const onTabChange = vi.fn()
    const model = buildProfileTabProps('created', 3, onTabChange)

    expect(model.tabsProps.value).toBe('created')
    model.tabsProps.onValueChange('binder')

    expect(onTabChange).toHaveBeenCalledWith('binder')
  })

  it('names the grid both tabs swap for the current tab', () => {
    const created = buildProfileTabProps('created', 3, vi.fn())
    const binder = buildProfileTabProps('binder', 1, vi.fn())

    expect(created.gridProps.id).toBe(PROFILE_CARDS_ID)
    expect(created.gridProps['aria-label']).toBe(copy.grid.label(copy.tabs.created, 3))
    expect(binder.gridProps['aria-label']).toBe(copy.grid.label(copy.tabs.binder, 1))
  })

  it('builds the full tab trigger from the tab name and count', () => {
    const labels = buildProfileTabLabels(3, 1)

    expect(labels.createdTabLabel).toBe(copy.tabs.trigger(copy.tabs.created, 3))
    expect(labels.binderTabLabel).toBe(copy.tabs.trigger(copy.tabs.binder, 1))
  })
})
