import { describe, expect, it, vi } from 'vitest'
import { settingsCopy as copy } from '../copy/settings'
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

    expect(model).toMatchObject({ title: copy.title, intro: copy.intro })
    expect([
      model.account?.heading,
      model.appearance.heading,
      model.connections.heading,
      model.alerts.heading,
    ]).toEqual([copy.account.heading, copy.appearance.heading, copy.connections.heading, copy.alerts.heading])
  })

  it('reads the account off the avatar, and drops the card when there is no session', () => {
    expect(build().account).toMatchObject({
      nameLabel: copy.account.name('lou'),
      providerLabel: copy.account.provider,
      logoutLabel: copy.account.logOut,
    })
    expect(build().account?.logoutButtonProps['aria-label']).toBe(copy.account.logOut)
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
    expect(model.appearance.caption).toBe(copy.appearance.caption)
    model.appearance.theme.onChange('light')
    expect(onChange).toHaveBeenCalledWith('light')
  })

  it('states the Discord link as unknown-and-therefore-not-linked, pointing at the page that starts it', () => {
    expect(build().connections.rows).toEqual([
      expect.objectContaining({
        serviceLabel: copy.connections.discord.service,
        stateLabel: copy.connections.discord.notLinked,
        linked: false,
        actionLabel: copy.connections.discord.connect,
        actionLinkProps: { to: '/discord' },
      }),
    ])
  })

  it('ships the alert switches inert rather than faking a save', () => {
    const model = build()

    expect(model.alerts.toggles.map((toggle) => toggle.label)).toEqual([copy.alerts.sales, copy.alerts.tierUps])
    for (const toggle of model.alerts.toggles) {
      expect(toggle.buttonProps.disabled).toBe(true)
      expect(toggle.on).toBe(false)
    }
    expect(model.alerts.caption).toBe(copy.alerts.caption)
  })
})
