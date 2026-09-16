import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FooterLink } from '@/organisms/nav-item'
import { cn } from '../lib/cn'
import './app-shell.css'

/**
 * The shell's breakpoint is `2xl` (900px, `src/index.css`): at and above it the chrome is the
 * sticky sidebar; below it, the sticky phone header and the fixed tab bar. `AppShell.css` keys
 * `--topbar-h` off the same width.
 */

/** The shared ring (`lib/focus`), on every control this file paints itself. */
const FOCUS = 'focus-ring'

/**
 * A bypass block costs nothing until it is focused: it sits at the page's top-left and waits 80px
 * above it, translated rather than offset, so the slide is a stock transition (`transition-lift`
 * carries its own reduced-motion off switch) instead of an arbitrary `[transition:top…]`.
 */
const SKIP_LINK = cn(
  'absolute top-3 left-3 z-[calc(var(--z-header)+10)]',
  'rounded-lg material-raised px-4 py-2.5 text-foreground',
  '-translate-y-20 transition-lift',
  'focus:translate-y-0',
  FOCUS,
)

/** The design's frame: 1440 centred, the sidebar column 20 in, the content column from x 276. */
const FRAME = 'relative mx-auto flex w-full max-w-360 grow'

/** 20 gutter + 216 shell; the column stretches the frame's height so the shell can stick inside it. */
const SIDEBAR_COLUMN = 'hidden w-59 shrink-0 py-5 pl-5 xl:block'

/**
 * The ceramic shell: sticky 20 from the top, viewport-tall, scrolling inside when short. It wears
 * the chrome's z-index so a page's own sticky band (`--z-sticky`, the marketplace controls) can
 * never paint over the navigation.
 */
const SIDEBAR = cn(
  'sticky top-5 z-(--z-header) flex h-[calc(100dvh-40px)] w-54 flex-col overflow-y-auto scrollbar-thin',
  'rounded-xl material-card',
)

/**
 * The content column. `<main>` is a screen's element, so the flex rules `#root > main` used to
 * carry (grow to push the footer down, full width against `PageContainer`'s auto margins) are
 * restated here for a nested main.
 */
const CONTENT = cn('flex min-w-0 flex-1 flex-col', '[&>main]:w-full [&>main]:grow')
/** App content inset: 276 = frame gutter + sidebar + column padding. */
const CONTENT_APP = 'xl:pr-9 xl:pl-5'
/** Public pages: 72px from the frame edge. */
const CONTENT_PUBLIC = 'xl:px-13'

/**
 * One header for every state. Below 900 it is the sticky blur plate the page scrolls under
 * (`--topbar-h`, AppShell.css, is its 64px); at 900+ it is a static row — the sidebar is the
 * persistent chrome, so nothing needs to stick.
 */
const HEADER = cn(
  'flex items-center gap-2.5',
  'max-xl:sticky max-xl:top-0 max-xl:z-(--z-header) max-xl:min-h-16 max-xl:py-1',
  'max-xl:px-page-safe max-xl:glass',
  'xl:gap-4.5',
)
const HEADER_APP = 'xl:mt-7 xl:min-h-14 xl:px-5'
/** Public header: 52px column inset + PageContainer padding. */
const HEADER_PUBLIC = 'xl:px-5 xl:py-8'

/** The wordmark: Unbounded 500 — with the landing hero, the typeset's two poster moments. */
const WORDMARK = cn(
  'inline-flex shrink-0 items-center gap-2 whitespace-nowrap',
  'font-display font-medium text-foreground no-underline',
  FOCUS,
)
const WORDMARK_SIZE = {
  sidebar: 'text-3xl',
  header: 'text-3xl max-md:text-2xl xl:text-4xl',
} as const

function Wordmark({ size, className }: { size: keyof typeof WORDMARK_SIZE; className?: string | undefined }) {
  return (
    <Link to="/" className={cn(WORDMARK, WORDMARK_SIZE[size], className)} data-slot="logo">
      {/* hide circle mark on phone — 350px header fits wordmark + cluster only */}
      <img
        src="/brand/memeon-logo-circle-64.png"
        alt=""
        className={cn('size-7.5', size === 'header' && 'max-xl:hidden')}
        width={30}
        height={30}
      />
      MemeOn
    </Link>
  )
}

/** 370×80 at 10 from the bottom, fluid to the phone's width, radius 30, raised. */
const TAB_BAR = cn(
  'fixed bottom-[calc(10px+env(safe-area-inset-bottom,0px))] left-1/2 z-(--z-header) -translate-x-1/2',
  'flex h-20 w-[calc(100%-calc(var(--spacing)*5))] max-w-92.5 items-center justify-around pb-3',
  'rounded-xl material-card',
  'xl:hidden',
)

const FOOTER = cn(
  'mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border',
  'px-5 pt-5.5 pb-safe-8.5',
  'text-sm text-muted-foreground',
  'max-xl:flex-col max-xl:items-center',
)
const FOOTER_APP = 'xl:px-5'
const FOOTER_PUBLIC = 'xl:px-5'

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
          className={cn(CONTENT, app ? CONTENT_APP : CONTENT_PUBLIC)}
          data-slot="content"
        >
          <header className={cn(HEADER, app ? HEADER_APP : HEADER_PUBLIC)} data-slot="header">
            {/* the sidebar carries the app's wordmark at 900+; the header keeps it for the phone and the public pages */}
            <Wordmark size="header" className={app ? 'xl:hidden' : undefined} />
            {app && contextLine ? (
              <p
                className="m-0 hidden min-w-0 truncate text-base font-medium text-muted-foreground xl:block"
                data-slot="context-line"
              >
                {contextLine}
              </p>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-2.5 xl:gap-4.5" data-slot="header-end">
              {headerEnd}
            </div>
          </header>
          {quest}
          {children}
          <footer className={cn(FOOTER, app ? FOOTER_APP : FOOTER_PUBLIC)} data-slot="site-footer">
            <span className="font-display text-2xl font-medium text-foreground">MemeOn</span>
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 xl:ml-auto" aria-label="Footer">
              <FooterLink render={<NavLink to="/privacy" />}>Privacy</FooterLink>
              <FooterLink render={<NavLink to="/terms" />}>Terms</FooterLink>
              <FooterLink render={<NavLink to="/developers" />}>Developers</FooterLink>
              <FooterLink render={<NavLink to="/discord" />}>Discord</FooterLink>
              {/* a real static file in public/, not a route: it must leave the SPA */}
              <FooterLink href="/skill.md">API</FooterLink>
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
