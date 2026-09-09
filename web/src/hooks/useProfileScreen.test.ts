import { describe, expect, it, vi } from 'vitest'
import { buildProfileTabProps } from './useProfileScreen'

describe('profile tab model props', () => {
  it('exposes selected state and sends the selected tab through supplied button props', () => {
    const onTabChange = vi.fn()
    const model = buildProfileTabProps('created', onTabChange)

    expect(model.createdTabButtonProps['aria-pressed']).toBe(true)
    expect(model.binderTabButtonProps['aria-pressed']).toBe(false)
    model.binderTabButtonProps.onClick?.({} as never)

    expect(onTabChange).toHaveBeenCalledWith('binder')
  })
})
