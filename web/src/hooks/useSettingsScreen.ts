import { useNavigate } from 'react-router-dom'
import type { ButtonHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import { settingsCopy } from '../copy/settings'
import type { Me } from '../lib/types'
import type { ThemeControlModel } from '../molecules/ThemeControl'
import { useAuth } from './useAuth'
import { useTheme } from './useTheme'

/** Account card: name, provider, logout. */
export interface SettingsAccountModel {
  heading: string
  /** Brain mark is part of the name label, not a separate icon. */
  nameLabel: string
  providerLabel: string
  logoutLabel: string
  logoutButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
}

/** One service row today; list-shaped for a second connection. */
export interface SettingsConnectionModel {
  key: string
  /** `🎭 Discord` — emoji stays emoji. */
  serviceLabel: string
  stateLabel: string
  linked: boolean
  actionLabel: string
  actionLinkProps: Pick<LinkProps, 'to'>
}

/** No alert API yet — toggles ship disabled so they do not look live. */
export interface SettingsAlertToggleModel {
  key: string
  label: string
  on: boolean
  buttonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'aria-pressed'>
}

export interface SettingsScreenModel {
  title: string
  intro: string
  /** `null` only in the split second before auth resolves; the route itself is behind RequireAuth. */
  account: SettingsAccountModel | null
  appearance: {
    heading: string
    caption: string
    theme: ThemeControlModel
  }
  connections: {
    heading: string
    rows: readonly SettingsConnectionModel[]
  }
  alerts: {
    heading: string
    caption: string
    toggles: readonly SettingsAlertToggleModel[]
  }
}

/**
 * Pure projection of the two engines Settings reads (the auth bag's user and the theme store), so
 * the model can be built — and asserted — without a React tree.
 */
export function buildSettingsScreenModel({
  user,
  theme,
  onLogout,
}: {
  user: Me | null
  theme: Pick<ThemeControlModel, 'value' | 'onChange'>
  onLogout: () => void
}): SettingsScreenModel {
  const copy = settingsCopy
  return {
    title: copy.title,
    intro: copy.intro,
    account: user
      ? {
          heading: copy.account.heading,
          nameLabel: copy.account.name(user.name),
          providerLabel: copy.account.provider,
          logoutLabel: copy.account.logOut,
          logoutButtonProps: { onClick: onLogout, 'aria-label': copy.account.logOut },
        }
      : null,
    appearance: {
      heading: copy.appearance.heading,
      caption: copy.appearance.caption,
      theme: { value: theme.value, onChange: theme.onChange, variant: 'segmented' },
    },
    connections: {
      heading: copy.connections.heading,
      rows: [
        {
          key: 'discord',
          serviceLabel: copy.connections.discord.service,
          /* `Me` carries no Discord field, so the app cannot know: it says the one thing it does
             know rather than guessing "Linked". See the receipt's Known gaps. */
          stateLabel: copy.connections.discord.notLinked,
          linked: false,
          actionLabel: copy.connections.discord.connect,
          /* linking starts with /memeon-connect inside Discord (that is where the token comes
             from), and /discord is the page that hands it over. /discord/link without a token is
             the error state, so it is never the place to send somebody from here. */
          actionLinkProps: { to: '/discord' },
        },
      ],
    },
    alerts: {
      heading: copy.alerts.heading,
      caption: copy.alerts.caption,
      toggles: [
        { key: 'sales', label: copy.alerts.sales, on: false, buttonProps: { disabled: true, 'aria-pressed': false } },
        { key: 'tier-ups', label: copy.alerts.tierUps, on: false, buttonProps: { disabled: true, 'aria-pressed': false } },
      ],
    },
  }
}

/** Everything `SettingsScreen` renders. The hook is the engine; the screen is the terminal. */
export function useSettingsScreen(): SettingsScreenModel {
  const { user, logout } = useAuth()
  const { preference, setPreference } = useTheme()
  const navigate = useNavigate()

  return buildSettingsScreenModel({
    user,
    theme: { value: preference, onChange: setPreference },
    onLogout: () => {
      logout()
      // the shell does the same: leave the guarded route before RequireAuth can bounce it
      navigate('/')
    },
  })
}
