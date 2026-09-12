import { describe, expect, it, vi } from 'vitest'
import type { Me } from '../lib/types'
import { buildSettingsScreenModel } from './useSettingsScreen'

const user: Me = {
  sub: 'user-lou',
  name: 'lou',
  picture: null,
  coins: 120,
  portfolioValue: 40,
  collectionSize: 3,
  unreadAlerts: 1,
}

const build = (overrides: Partial<Parameters<typeof buildSettingsScreenModel>[0]> = {}) =>
  buildSettingsScreenModel({
    user,
    theme: { value: 'auto', onChange: () => {} },
    onLogout: () => {},
    ...overrides,
  })

describe('settings screen model', () => {
  it('names the four cards Lou kept and nothing else', () => {
    const model = build()

    expect(model).toMatchObject({ title: 'Settings', intro: 'Make yourself at home.' })
    expect([
      model.account?.heading,
      model.appearance.heading,
      model.connections.heading,
      model.alerts.heading,
    ]).toEqual(['Account', 'Appearance', 'Connections', 'Alerts'])
  })

  it('reads the account off the avatar, and drops the card when there is no session', () => {
    expect(build().account).toMatchObject({
      nameLabel: '🧠 lou',
      providerLabel: 'Masky avatar',
      logoutLabel: 'Log out',
    })
    expect(build({ user: null }).account).toBeNull()
  })

  it('logs out through the caller, once per press', () => {
    const onLogout = vi.fn()

    // the handler ignores its event, so the test calls it as the press it stands for
    const press = build({ onLogout }).account?.logoutButtonProps.onClick as (() => void) | undefined
    press?.()

    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('hands Appearance the theme preference and its setter, as the segmented well', () => {
    const onChange = vi.fn()
    const model = build({ theme: { value: 'dark', onChange } })

    expect(model.appearance.theme).toMatchObject({ value: 'dark', variant: 'segmented' })
    expect(model.appearance.caption).toBe('Auto follows your device.')
    model.appearance.theme.onChange('light')
    expect(onChange).toHaveBeenCalledWith('light')
  })

  it('states the Discord link as unknown-and-therefore-not-linked, pointing at the page that starts it', () => {
    expect(build().connections.rows).toEqual([
      expect.objectContaining({
        serviceLabel: '🎭 Discord',
        stateLabel: 'Not linked',
        linked: false,
        actionLabel: 'Connect Discord',
        actionLinkProps: { to: '/discord' },
      }),
    ])
  })

  it('ships the alert switches inert rather than faking a save', () => {
    const model = build()

    expect(model.alerts.toggles.map((toggle) => toggle.label)).toEqual(['Sales', 'Tier-ups'])
    for (const toggle of model.alerts.toggles) {
      expect(toggle.buttonProps.disabled).toBe(true)
      expect(toggle.on).toBe(false)
    }
    expect(model.alerts.caption).toMatch(/Coming soon/)
  })
})
