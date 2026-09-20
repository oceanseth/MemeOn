import { useNavigate } from 'react-router-dom'
import type { ButtonHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import type { IconName } from '@/atoms/icon'
import { settingsCopy } from '../copy/settings'
import type { Me } from '../lib/types'
import { buildThemeControlModel, type ThemeControlModel } from '../lib/themeControlModel'
import { useAuth } from './useAuth'
import { usePlayVideos } from './usePlayVideos'
import { useTheme } from './useTheme'

/** Account card: name, provider, logout. */
export interface SettingsAccountModel {
  heading: string
  /**
   * The signed-in user's own display name, unadorned. The shell states the rule for every identity
   * affordance — it "stays *your* monogram, never the MemeOn mark" (`avatarMenu` in
   * useAppShellScreen) — and this row is that same affordance in card form, so nothing leads it.
   * The brain that used to is MemeOn's mark, not Lou's: it read as the product claiming the name.
   */
  nameLabel: string
  providerLabel: string
  logoutLabel: string
  logoutButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
}

/** One service row today; list-shaped for a second connection. */
export interface SettingsConnectionModel {
  key: string
  /**
   * The mark drawn ahead of the label, or `null` for a text-only row. It is the hook's call and not
   * the screen's because the screen renders whatever rows it is handed: one glyph spelled into the
   * markup is a glyph every future connection inherits, which is precisely how a gamepad came to
   * label Discord. `null` on every row today — see the row itself for why Discord has no mark.
   */
  icon: IconName | null
  /** `Discord`, spelled the way the design spells it everywhere: plain text. */
  serviceLabel: string
  stateLabel: string
  linked: boolean
  actionLabel: string
  actionLinkProps: Pick<LinkProps, 'to'>
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
    playVideos: {
      label: string
      caption: string
      checked: boolean
      onCheckedChange: (checked: boolean) => void
    }
  }
  connections: {
    heading: string
    rows: readonly SettingsConnectionModel[]
  }
}

/**
 * Pure projection of the two engines Settings reads (the auth bag's user and the theme store), so
 * the model can be built — and asserted — without a React tree.
 */
export function buildSettingsScreenModel({
  user,
  theme,
  playVideos = { checked: true, onCheckedChange: () => {} },
  onLogout,
}: {
  user: Me | null
  theme: Pick<ThemeControlModel, 'value' | 'onChange'>
  playVideos?: { checked: boolean; onCheckedChange: (checked: boolean) => void }
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
      theme: buildThemeControlModel({
        value: theme.value,
        onChange: theme.onChange,
        variant: 'segmented',
      }),
      playVideos: {
        label: copy.appearance.playVideos,
        caption: copy.appearance.playVideosCaption,
        checked: playVideos.checked,
        onCheckedChange: playVideos.onCheckedChange,
      },
    },
    connections: {
      heading: copy.connections.heading,
      rows: [
        {
          key: 'discord',
          /* The brand mark, the same one the account menu's Discord row now wears. It is filled
             and never stroked — the objection that kept this row text is still the reason the atom
             draws it that way rather than joining it to the 1.5 family. See the PROVENANCE block
             in atoms/icon.tsx. */
          icon: 'discord',
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
  }
}

/** Everything `SettingsScreen` renders. The hook is the engine; the screen is the terminal. */
export function useSettingsScreen(): SettingsScreenModel {
  const { user, logout } = useAuth()
  const { preference, setPreference } = useTheme()
  const { playVideos, setPlayVideos } = usePlayVideos()
  const navigate = useNavigate()

  return buildSettingsScreenModel({
    user,
    theme: { value: preference, onChange: setPreference },
    playVideos: { checked: playVideos, onCheckedChange: setPlayVideos },
    onLogout: () => {
      logout()
      // the shell does the same: leave the guarded route before RequireAuth can bounce it
      navigate('/')
    },
  })
}
