import { describe, expect, it, vi } from 'vitest'
import { sharedCopy } from '../copy/shared'
import { buildThemeControlModel, THEME_OPTIONS } from './themeControlModel'

describe('buildThemeControlModel', () => {
  it('resolves labels and the cycle sentence from sharedCopy.theme', () => {
    const onChange = vi.fn()
    const model = buildThemeControlModel({
      value: 'auto',
      onChange,
      variant: 'button',
    })

    expect(model.groupLabel).toBe(sharedCopy.theme.group)
    expect(model.cycleLabel).toBe(
      sharedCopy.theme.cycle(sharedCopy.theme.auto, sharedCopy.theme.light),
    )
    expect(model.nextValue).toBe('light')
    expect(model.options).toBe(THEME_OPTIONS)
    expect(model.options.map((option) => option.label)).toEqual([
      sharedCopy.theme.auto,
      sharedCopy.theme.light,
      sharedCopy.theme.dark,
    ])
    model.onChange('dark')
    expect(onChange).toHaveBeenCalledWith('dark')
  })

  it('cycles dark back to auto', () => {
    const model = buildThemeControlModel({
      value: 'dark',
      onChange: vi.fn(),
      variant: 'segmented',
    })
    expect(model.cycleLabel).toBe(
      sharedCopy.theme.cycle(sharedCopy.theme.dark, sharedCopy.theme.auto),
    )
    expect(model.nextValue).toBe('auto')
    expect(model.variant).toBe('segmented')
  })
})
