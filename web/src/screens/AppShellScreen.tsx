import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/atoms/button'
import { Icon } from '@/atoms/icon'
import { cn } from '../lib/cn'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AlertsBell } from '@/molecules/alerts-bell'
import { AvatarMenu } from '@/molecules/avatar-menu'
import { QuestBar } from '@/molecules/quest-bar'
import { ThemeControl } from '@/molecules/theme-control'
import { AppShell } from '@/organisms/app-shell'
import { NavPill, TabItem } from '@/organisms/nav-item'

/** App chrome as a function of its model. QuestBar, AlertsBell, ThemeControl and AvatarMenu take model props. */
export function AppShellScreen({
  children,
  showNav,
  showToolbar,
  navItems,
  mint,
  theme,
  coins,
  bottomNav,
  avatarMenu,
  alertsBell,
  questBar,
}: AppShellScreenModel & { children: ReactNode }) {
  const nav = showNav
    ? navItems.map((item) => (
        <NavPill key={item.to} current={item.current} render={<Link {...item.linkProps} />}>
          {item.icon && (
            <span aria-hidden="true">
              <Icon name={item.icon} size={16} />
            </span>
          )}
          {item.label}
        </NavPill>
      ))
    : undefined

  const headerEnd = (
    <>
      {/* the public header's one control; signed in, the theme lives in the account menu */}
      {!showNav && <ThemeControl model={theme} size="lg" />}
      {/* the chrome's one primary, as a link: shadcn's "as link" form of the Button. The phone's is
          the tab bar's; between 900 and 1100 the glyph alone shows and the name stays for readers */}
      {showNav && (
        <Link
          {...mint.linkProps}
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'max-xl:hidden')}
          data-slot="mint-link"
        >
          <span aria-hidden="true">
            <Icon name="circle-plus" size={16} />
          </span>
          <span className="xl:max-2xl:sr-only">{mint.label}</span>
        </Link>
      )}
      {showToolbar && coins && <QuestBar model={questBar} balance={coins} />}
      {showToolbar && <AlertsBell model={alertsBell} />}
      {showToolbar && avatarMenu && <AvatarMenu model={avatarMenu} />}
    </>
  )

  const tabs = showNav
    ? bottomNav.map((item) => (
        <TabItem
          key={item.to}
          current={item.current}
          primary={item.primary}
          render={<Link {...item.linkProps} />}
        >
          <Icon name={item.icon} size={22} />
          {item.label}
        </TabItem>
      ))
    : undefined

  return (
    <AppShell nav={nav} headerEnd={headerEnd} bottomNav={tabs}>
      {children}
    </AppShell>
  )
}
