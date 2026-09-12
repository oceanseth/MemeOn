import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import './AppShell.css'

/**
 * The shell's breakpoint is `2xl` (900px, `src/index.css`): at and above it the chrome is the
 * sticky sidebar; below it, the sticky phone header and the fixed tab bar. `AppShell.css` keys
 * `--topbar-h` off the same width.
 */

/** The one authored focus ring, repeated on every control this file paints itself. */
export const FOCUS = cn(
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
)

/** A bypass block costs nothing until it is focused: it waits 60px above the page. */
const SKIP_LINK = cn(
  'absolute top-[-60px] left-3 z-[calc(var(--z-header)+10)]',
  'rounded-control bg-surface-raised px-4 py-2.5 text-ink no-underline shadow-raised',
  '[transition:top_var(--dur-base)_ease] motion-reduce:transition-none',
  'focus:top-3',
  FOCUS,
)

/** The design's frame: 1440 centred, the sidebar column 20 in, the content column from x 276. */
const FRAME = 'relative mx-auto flex w-full max-w-app grow'

/** 20 gutter + 216 shell; the column stretches the frame's height so the shell can stick inside it. */
const SIDEBAR_COLUMN = 'hidden w-[236px] shrink-0 py-5 pl-5 2xl:block'

/**
 * The ceramic shell: sticky 20 from the top, viewport-tall, scrolling inside when short. It wears
 * the chrome's z-index so a page's own sticky band (`--z-sticky`, the marketplace controls) can
 * never paint over the navigation.
 */
const SIDEBAR = cn(
  'sticky top-5 z-(--z-header) flex h-[calc(100dvh-40px)] w-[216px] flex-col overflow-y-auto [scrollbar-width:thin]',
  'rounded-shell bg-surface shadow-raised',
)

/**
 * The content column. `<main>` is a screen's element, so the flex rules `#root > main` used to
 * carry (grow to push the footer down, full width against `PageContainer`'s auto margins) are
 * restated here for a nested main.
 */
const CONTENT = cn('flex min-w-0 flex-1 flex-col', '[&>main]:w-full [&>main]:grow')
/** 276 = 20 + 216 + 40 with `PageContainer`'s own 20; 56 on the right the same way. */
const CONTENT_APP = '2xl:pr-9 2xl:pl-10'
/** The public boards sit 72 in from the frame edge. */
const CONTENT_PUBLIC = '2xl:px-[52px]'
/** The fixed tab bar is 80 tall, 10 up: the column ends 100 above the safe area so nothing hides under it. */
const CONTENT_ABOVE_TABS = 'max-2xl:pb-[calc(100px+env(safe-area-inset-bottom,0px))]'

/**
 * One header for every state. Below 900 it is the sticky blur plate the page scrolls under
 * (`--topbar-h`, AppShell.css, is its 64px); at 900+ it is a static row — the sidebar is the
 * persistent chrome, so nothing needs to stick.
 */
const HEADER = cn(
  'flex items-center gap-2.5',
  'max-2xl:sticky max-2xl:top-0 max-2xl:z-(--z-header) max-2xl:min-h-16 max-2xl:py-[5px]',
  'max-2xl:[padding-inline:max(20px,env(safe-area-inset-left))_max(20px,env(safe-area-inset-right))]',
  'max-2xl:bg-[color-mix(in_oklab,var(--color-canvas)_85%,transparent)] max-2xl:backdrop-blur-[12px]',
  '2xl:gap-[18px]',
)
const HEADER_APP = '2xl:mt-[29px] 2xl:min-h-[54px] 2xl:px-5'
/** 72 from the frame edge on the public boards = the column's 52 + the same 20 `PageContainer` pads. */
const HEADER_PUBLIC = '2xl:px-5 2xl:py-8'

/** The wordmark: Unbounded at the display weight, the circle mark beside it; sized per slot. */
const WORDMARK = cn(
  'inline-flex shrink-0 items-center gap-2 whitespace-nowrap',
  'font-display font-medium tracking-title text-ink no-underline',
  FOCUS,
)
const WORDMARK_SIZE = {
  sidebar: 'text-[26px] leading-[34px]',
  /* 27/34 fits a 390 phone exactly (146 + the 186 cluster in 350); 375-wide devices get 24 */
  header: 'text-[27px] leading-[34px] max-[380px]:text-[24px] 2xl:text-[31px] 2xl:leading-[39px]',
} as const

function Wordmark({ size, className }: { size: keyof typeof WORDMARK_SIZE; className?: string | undefined }) {
  return (
    <Link to="/" className={cn(WORDMARK, WORDMARK_SIZE[size], className)} data-slot="logo">
      {/* the circle mark rides beside the word where there is room; the 350px phone header is the
          word (146) + the cluster (186) exactly, so there it is the word alone (as the board draws it) */}
      <img
        src="/brand/memeon-logo-circle-64.png"
        alt=""
        className={cn('size-[30px]', size === 'header' && 'max-2xl:hidden')}
        width={30}
        height={30}
      />
      MemeOn
    </Link>
  )
}

/** Sidebar nav row: 192×48, radius 24, icon lane 22 + label 15/19; current = pressed + 600. */
export const NAV_ROW = cn(
  'flex h-12 items-center gap-3 rounded-nav px-3.5',
  'text-label font-medium text-ink no-underline',
  '[transition:background_var(--dur-base)_ease,box-shadow_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:bg-surface-raised',
  'aria-[current=page]:bg-surface-pressed aria-[current=page]:font-semibold aria-[current=page]:shadow-pressed',
  FOCUS,
)

/** The chrome's one primary: bubblegum in light, sky in dark, raised, 46 tall. */
export const PRIMARY_PILL = cn(
  'inline-flex h-[46px] items-center justify-center gap-[9px] whitespace-nowrap rounded-control px-[18px]',
  'bg-action text-label font-semibold text-on-action no-underline shadow-raised',
  '[transition:transform_var(--dur-fast)_ease] motion-reduce:transition-none',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px motion-reduce:hover:translate-y-0!',
  'pointer-coarse:active:translate-y-px',
  FOCUS,
)

/** Utility link: Onest 14/18 500; the current one is a 36px pressed pill (plan-buckets › navigation-chrome). */
export const UTILITY_LINK = cn(
  '-ml-3 inline-flex h-9 items-center rounded-[18px] px-3',
  'text-small font-medium text-ink no-underline',
  '[transition:background_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:bg-surface-raised',
  'aria-[current=page]:bg-surface-pressed aria-[current=page]:font-bold aria-[current=page]:shadow-pressed',
  'pointer-coarse:min-h-11',
  FOCUS,
)

/** Tab bar item: 62×44, radius 22, icon 22 over a 12px label; current = pressed + 700. */
export const TAB_ITEM = cn(
  'flex h-11 w-[62px] shrink-0 flex-col items-center justify-center gap-[5px] rounded-[22px]',
  'text-micro leading-[15px] font-semibold text-ink no-underline',
  'aria-[current=page]:bg-surface-pressed aria-[current=page]:font-bold aria-[current=page]:shadow-pressed',
  FOCUS,
)

/** The centre Mint item: the tab bar's single primary, raised in the action colour; pressed when current. */
export const TAB_ITEM_PRIMARY = cn(
  'bg-action text-on-action shadow-raised',
  'aria-[current=page]:bg-action aria-[current=page]:text-on-action',
)

/** 370×80 at 10 from the bottom, fluid to the phone's width, radius 30, raised. */
const TAB_BAR = cn(
  'fixed bottom-[calc(10px+env(safe-area-inset-bottom,0px))] left-1/2 z-(--z-header) -translate-x-1/2',
  'flex h-20 w-[calc(100%-20px)] max-w-[370px] items-center justify-around pb-3',
  'rounded-tabbar bg-surface shadow-raised',
  '2xl:hidden',
)

const FOOTER = cn(
  'mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line',
  'px-5 pt-[22px] pb-[max(34px,env(safe-area-inset-bottom))]',
  'text-[13px] leading-4 text-ink-muted',
  'max-2xl:flex-col max-2xl:items-center',
)
const FOOTER_APP = '2xl:px-5'
const FOOTER_PUBLIC = '2xl:px-5'

/** Onest 13 ink-muted; the current page is bold ink (react-router's `aria-current` from NavLink). */
const FOOTER_LINK = cn(
  'text-ink-muted no-underline',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:text-ink',
  'aria-[current=page]:font-bold aria-[current=page]:text-ink',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
  FOCUS,
)

export interface AppShellProps {
  /** The signed-in sidebar's content, under the wordmark. Its presence selects the app layout. */
  sidebar?: ReactNode | undefined
  /** Desktop header, left: Onest 15/19 ink-muted. Empty renders nothing. */
  contextLine?: ReactNode | undefined
  /** The header's right cluster: theme button, balance, bell, avatar. */
  headerEnd?: ReactNode | undefined
  quest?: ReactNode | undefined
  /** The phone tab bar's items; the bar itself is this organism's. */
  bottomNav?: ReactNode | undefined
  children: ReactNode
}

/**
 * App chrome: skip link, the frame (sidebar column + content column with header, quest rail, the
 * route's `<main>` and the footer), the phone tab bar. Parent fills slots — this organism does
 * not read auth.
 */
export function AppShell({ sidebar, contextLine, headerEnd, quest, bottomNav, children }: AppShellProps) {
  const app = sidebar !== undefined && sidebar !== null && sidebar !== false
  return (
    <>
      <a className={SKIP_LINK} href="#main" data-slot="skip-link">
        Skip to content
      </a>
      <div className={FRAME} data-slot="app-frame" data-layout={app ? 'app' : 'public'}>
        {app && (
          <div className={SIDEBAR_COLUMN} data-slot="sidebar-column">
            <aside className={SIDEBAR} data-slot="sidebar">
              <div className="flex min-h-full flex-col px-3 pt-7 pb-4">
                <Wordmark size="sidebar" className="mx-3" />
                {sidebar}
              </div>
            </aside>
          </div>
        )}
        <div
          className={cn(CONTENT, app ? CONTENT_APP : CONTENT_PUBLIC, bottomNav && CONTENT_ABOVE_TABS)}
          data-slot="content"
        >
          <header className={cn(HEADER, app ? HEADER_APP : HEADER_PUBLIC)} data-slot="header">
            {/* the sidebar carries the app's wordmark at 900+; the header keeps it for the phone and the public pages */}
            <Wordmark size="header" className={app ? '2xl:hidden' : undefined} />
            {app && contextLine ? (
              <p
                className="m-0 hidden min-w-0 truncate text-label font-medium text-ink-muted 2xl:block"
                data-slot="context-line"
              >
                {contextLine}
              </p>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-2.5 2xl:gap-[18px]" data-slot="header-end">
              {headerEnd}
            </div>
          </header>
          {quest}
          {children}
          <footer className={cn(FOOTER, app ? FOOTER_APP : FOOTER_PUBLIC)} data-slot="site-footer">
            <span className="font-display text-[20px] leading-[25px] font-medium tracking-title text-ink">MemeOn</span>
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 2xl:ml-auto" aria-label="Footer">
              <NavLink to="/privacy" className={() => FOOTER_LINK}>
                Privacy
              </NavLink>
              <NavLink to="/terms" className={() => FOOTER_LINK}>
                Terms
              </NavLink>
              <NavLink to="/developers" className={() => FOOTER_LINK}>
                Developers
              </NavLink>
              <NavLink to="/discord" className={() => FOOTER_LINK}>
                Discord
              </NavLink>
              {/* a real static file in public/, not a route: it must leave the SPA */}
              <a href="/skill.md" className={FOOTER_LINK}>
                API
              </a>
            </nav>
          </footer>
        </div>
      </div>
      {bottomNav && (
        <nav className={TAB_BAR} aria-label="Main" data-slot="bottom-nav">
          {bottomNav}
        </nav>
      )}
    </>
  )
}
