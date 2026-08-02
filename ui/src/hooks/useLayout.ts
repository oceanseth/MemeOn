import { useMemo } from 'react'
import type { NavUser } from '../types'

const NAV = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/binder', label: 'My Binder' },
  { to: '/friends', label: 'Friends' },
  { to: '/trade', label: 'Trade' },
  { to: '/leaderboard', label: '🏆 Top Brains' },
]

const FOOTER = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/developers', label: 'Developers' },
  { href: '/discord', label: 'Discord' },
  { href: '/skill.md', label: 'API' },
]

/**
 * Mechanism for the app chrome: signed-in gating, nav and footer targets, and
 * the user-dependent bits of the topbar.
 */
export function useLayout({
  user = null,
  logoSrc = '/brand/memeon-logo-circle-64.png',
  onLogout,
}: {
  user?: NavUser | null
  logoSrc?: string
  onLogout?: () => void
}) {
  return useMemo(
    () => ({
      isSignedIn: !!user,
      nav: NAV,
      footer: FOOTER,
      coinsLabel: user ? `🧠 ${user.coins.toLocaleString()}` : '',
      hasAvatar: !!user?.picture,

      brandLinkProps: { to: '/' },
      logoImgProps: { src: logoSrc, alt: '' },
      discordLinkProps: {
        to: '/discord',
        title: 'MemeOn for Discord',
        'aria-label': 'MemeOn for Discord',
      },
      coinsProps: { title: 'Braincells' },
      profileLinkProps: user ? { to: `/u/${encodeURIComponent(user.sub)}` } : null,
      avatarProps: user?.picture ? { src: user.picture, alt: user.name } : null,
      logoutProps: { onClick: onLogout },
    }),
    [user, logoSrc, onLogout],
  )
}
