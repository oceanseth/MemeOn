import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FooterLink } from '@/organisms/nav-item'
import { cn } from '../lib/cn'
import './app-shell.css'

/**
 * One chrome at every width: a sticky glass bar (the wordmark, the five links from the shell cut
 * `xl` = 900px up, the header cluster) over a centred 1440 column, a quiet footer, and below the
 * cut the tab bar fixed flush to the viewport's bottom in the footer's place. The bar is 64 tall everywhere, which is
 * `--topbar-h` (`src/index.css`); `app-shell.css` carries what no utility can — the tab-bar
 * clearance and hairline, the hairline that appears under the bar once the page has scrolled,
 * and the view-transition names.
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

/**
 * The bar: sticky on glass, the chrome's z-index, so a page's own docked band (`--z-sticky`, the
 * marketplace controls) slides under it, never over. The row inside is the same 1440 column the
 * page uses, with the page's gutter, so the wordmark sits on the page title's left edge.
 */
const HEADER = cn('sticky top-0 z-(--z-header) glass')
const HEADER_ROW = cn(
  'mx-auto flex h-16 w-full max-w-360 items-center gap-3',
  'px-page-safe xl:gap-4 xl:px-8 2xl:px-13',
)

/**
 * The links, centred in the slack between the wordmark and the cluster; the phone has the tab bar.
 * Between 900 and 1100 the row is tight — the wordmark is its mark alone and Mint its glyph
 * alone — so the pills sit close; from 1100 the words come back.
 */
const NAV = 'mx-auto hidden min-w-0 items-center gap-0.5 xl:flex 2xl:gap-1'

const HEADER_END = 'ml-auto flex shrink-0 items-center gap-2.5 xl:gap-3'

/** The page: a centred 1440 column that grows, so a short route still puts the footer on the fold. */
const FRAME = 'relative mx-auto flex w-full max-w-360 grow flex-col'

/**
 * The route column. `<main>` is a screen's element, so the flex rules `#root > main` used to
 * carry (grow to push the footer down, full width against `PageContainer`'s auto margins) are
 * restated here for a nested main. The gutter steps with the header row's.
 */
const CONTENT = cn('flex min-w-0 grow flex-col', '[&>main]:w-full [&>main]:grow', 'xl:px-3 2xl:px-8')

/** The wordmark: Unbounded 500 — with the landing hero, the typeset's two poster moments. */
const WORDMARK = cn(
  'inline-flex shrink-0 items-center gap-2 whitespace-nowrap',
  'font-display text-3xl font-medium text-foreground no-underline max-md:text-2xl',
  FOCUS,
)

function Wordmark({ compact }: { compact: boolean }) {
  return (
    /* the name is on the link itself: the mark alone is what the app bar shows between 900 and 1100 */
    <Link to="/" className={WORDMARK} aria-label="MemeOn" data-slot="logo">
      {/* the circle mark: hidden on the phone, where the 350px header fits wordmark + cluster only */}
      <img
        src="/brand/memeon-logo-circle-64.png"
        alt=""
        className="size-7.5 max-xl:hidden"
        width={30}
        height={30}
      />
      <span className={compact ? 'xl:max-2xl:hidden' : undefined}>MemeOn</span>
    </Link>
  )
}

/**
 * The tab bar the way the phone draws its own: fixed to the viewport's bottom edge and spanning
 * it, no radius, glass with a hairline above (`app-shell.css`). The items sit in an 80 row and the
 * home indicator's inset is padding under them — `box-content`, so the inset adds to the 80 rather
 * than eating it, and the content column's clearance is the same sum. From the shell cut the
 * bar's links take over and it goes.
 */
const TAB_BAR = cn(
  'fixed inset-x-0 bottom-0 z-(--z-header)',
  'flex box-content h-20 items-center justify-around pb-safe',
  'glass',
  'xl:hidden',
)

/**
 * One quiet line: the name at the text step, the five links; a hairline above, the safe area below.
 * Where the tab bar is, it is not: a phone app has no site footer, so below the cut the signed-in
 * page ends at its last row. The public frame has no tab bar and keeps the footer at every width.
 */
const FOOTER = cn(
  'mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border',
  'px-5 pt-5 pb-safe-8',
  'text-sm text-muted-foreground',
  'max-xl:flex-col max-xl:items-center',
)

export interface AppShellProps {
  /** The signed-in bar's links (`NavPill`s). Their presence selects the app layout. */
  nav?: ReactNode | undefined
  /** The header's right cluster: Mint, the braincell pill, the bell, the avatar menu — or the public theme button. */
  headerEnd?: ReactNode | undefined
  /** The phone tab bar's items; the bar itself is this organism's. */
  bottomNav?: ReactNode | undefined
  children: ReactNode
}

/**
 * App chrome: skip link, the sticky bar, the column with the route's `<main>` and the footer, the
 * phone tab bar. Parent fills slots — this organism does not read auth.
 */
export function AppShell({ nav, headerEnd, bottomNav, children }: AppShellProps) {
  const app = nav !== undefined && nav !== null && nav !== false
  return (
    <>
      <a className={SKIP_LINK} href="#main" data-slot="skip-link">
        Skip to content
      </a>
      <header className={HEADER} data-slot="header">
        <div className={HEADER_ROW} data-slot="header-row">
          <Wordmark compact={app} />
          {app && (
            <nav className={NAV} aria-label="Main" data-slot="top-nav">
              {nav}
            </nav>
          )}
          <div className={HEADER_END} data-slot="header-end">
            {headerEnd}
          </div>
        </div>
      </header>
      <div className={FRAME} data-slot="app-frame" data-layout={app ? 'app' : 'public'}>
        <div className={CONTENT} data-slot="content">
          {children}
          <footer className={cn(FOOTER, bottomNav && 'max-xl:hidden')} data-slot="site-footer">
            <span className="font-semibold text-foreground">MemeOn</span>
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
