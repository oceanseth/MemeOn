import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import './AppShell.css'

/** The one authored focus ring, repeated on every control this file paints itself. */
const FOCUS = cn(
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
)

/** A bypass block costs nothing until it is focused: it waits 60px above the page. */
const SKIP_LINK = cn(
  'absolute top-[-60px] left-3 z-[calc(var(--z-header)+10)]',
  'rounded-card border border-accent bg-bg-raised px-4 py-2.5 text-text no-underline',
  '[transition:top_var(--dur-base)_ease] motion-reduce:transition-none',
  'focus:top-3',
  FOCUS,
)

const TOPBAR = cn(
  'sticky top-0 z-(--z-header) border-b border-border',
  'bg-[color-mix(in_oklab,var(--color-bg)_80%,transparent)] backdrop-blur-[12px]',
)

/** The border-bottom is the last pixel of `--topbar-h`, so the inner row stops one short of it. */
const TOPBAR_INNER = cn(
  'mx-auto flex max-w-page min-h-[calc(var(--topbar-h)-1px)] items-center gap-[18px] px-5 py-2.5',
  // ≤760: the bar wraps to two rows — mark + actions above, a swipeable nav row below
  'max-xl:flex-wrap max-xl:gap-2.5',
  'max-xl:[padding-inline:max(20px,env(safe-area-inset-left))_max(20px,env(safe-area-inset-right))]',
)

/**
 * The gradient wordmark is brand, not decoration: ≤760 it shrinks to the width the two-row topbar
 * has spare rather than being zeroed off the phone. Both the `background-clip: text` fallback and
 * forced colours drop back to a painted colour, because a transparent glyph over no gradient is an
 * invisible one.
 */
const LOGO = cn(
  'inline-flex items-center gap-2 whitespace-nowrap text-[20px] font-extrabold tracking-[0.5px]',
  'bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-gold))]',
  'bg-clip-text text-transparent',
  'not-supports-[background-clip:text]:bg-none not-supports-[background-clip:text]:text-accent',
  'forced-colors:bg-none forced-colors:text-[CanvasText]',
  'max-xl:gap-1 max-xl:text-[13px]',
  FOCUS,
)

/**
 * The nav row. `data-slot="nav-links"` is load-bearing: `AppShell.css` reads it to raise
 * `--topbar-h` when the topbar wraps to two rows.
 */
export const NAV_LINKS = cn(
  'flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  // ≤760: a full-width swipeable row under the mark, with an edge fade for the overflow
  'max-xl:order-3 max-xl:[flex:1_0_100%] max-xl:mx-[-20px] max-xl:mt-1.5 max-xl:px-5 max-xl:pb-0.5',
  'max-xl:[scroll-snap-type:x_proximity] max-xl:[-webkit-overflow-scrolling:touch]',
  'max-xl:[mask-image:linear-gradient(to_right,oklch(0_0_0)_88%,transparent)]',
)

/** Location is a shape hover never produces and touch never loses: an inset underline, not a tint. */
export const NAV_LINK = cn(
  'rounded-lg px-3 py-2 font-medium whitespace-nowrap text-text-dim',
  'hover:bg-bg-raised hover:text-text',
  'aria-[current=page]:bg-bg-raised aria-[current=page]:text-text',
  'aria-[current=page]:[box-shadow:inset_0_-2px_0_var(--color-accent)]',
  'max-xl:inline-flex max-xl:min-h-11 max-xl:items-center max-xl:[scroll-snap-align:start]',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
  FOCUS,
)

export const TOPBAR_RIGHT = cn('flex items-center gap-3', 'max-xl:ml-auto max-xl:min-w-0 max-xl:gap-2.5')

/** ≤480 it goes: the footer already carries a Discord link, and the row needs the width. */
const DISCORD_LINK = cn(
  'inline-flex items-center text-text-dim hover:text-brand-discord',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'max-xs:hidden',
  'pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center',
  FOCUS,
)

const SITE_FOOTER = cn(
  'mt-12 border-t border-border px-5 pt-[22px] pb-[max(34px,env(safe-area-inset-bottom))]',
  'text-center text-[13px] text-text-dim',
)

/**
 * Footer links sit in prose, so colour is never their only cue: they carry a dimmed underline that
 * fills in on hover and focus, and the current page thickens it.
 */
const FOOTER_LINK = cn(
  'mx-2.5 text-text-dim underline underline-offset-2 [text-decoration-thickness:1px]',
  '[text-decoration-color:color-mix(in_oklab,currentColor_60%,transparent)]',
  'hover:text-text hover:[text-decoration-color:currentColor]',
  'focus-visible:[text-decoration-color:currentColor]',
  'aria-[current=page]:text-text aria-[current=page]:[text-decoration-thickness:2px]',
  'pointer-coarse:mx-0 pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center pointer-coarse:px-3',
  FOCUS,
)

/**
 * App chrome: logo, optional nav/toolbar/quest slots, footer.
 * Parent fills slots — this organism does not read auth.
 */
export function AppShell({
  nav,
  toolbar,
  quest,
  children,
}: {
  nav?: ReactNode | undefined
  toolbar?: ReactNode | undefined
  quest?: ReactNode | undefined
  children: ReactNode
}) {
  return (
    <>
      <a className={SKIP_LINK} href="#main" data-slot="skip-link">
        Skip to content
      </a>
      <header className={TOPBAR} data-slot="topbar">
        <div className={TOPBAR_INNER} data-slot="topbar-inner">
          <Link to="/" className={LOGO} data-slot="logo">
            <img
              src="/brand/memeon-logo-circle-64.png"
              alt=""
              className="h-[30px] w-[30px]"
              width={30}
              height={30}
            />
            MemeOn
          </Link>
          {nav}
          <div className={TOPBAR_RIGHT} data-slot="topbar-right">
            <Link
              to="/discord"
              title="MemeOn for Discord"
              className={DISCORD_LINK}
              aria-label="MemeOn for Discord"
              data-slot="discord-link"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.07.07 0 0 0-.08-.04c-1.71.3-3.35.81-4.88 1.52a.06.06 0 0 0-.03.02C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.12c.13-.1.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.3a.08.08 0 0 1-.01.12c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.1c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.02-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.67a.06.06 0 0 0-.03-.02ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
              </svg>
            </Link>
            {toolbar}
          </div>
        </div>
      </header>
      {quest}
      {children}
      <footer className={SITE_FOOTER} data-slot="site-footer">
        <Link to="/privacy" className={FOOTER_LINK}>
          Privacy
        </Link>
        <Link to="/terms" className={FOOTER_LINK}>
          Terms
        </Link>
        <Link to="/developers" className={FOOTER_LINK}>
          Developers
        </Link>
        <Link to="/discord" className={FOOTER_LINK}>
          Discord
        </Link>
        {/* a real static file in public/, not a route: it must leave the SPA */}
        <a href="/skill.md" className={FOOTER_LINK}>
          API
        </a>
      </footer>
    </>
  )
}
