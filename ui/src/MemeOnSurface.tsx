import { MemoryRouter } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import { useMemeOnSurface } from './hooks/useMemeOnSurface'

/** The app canvas — mirrors `body` in the design system stylesheet. */
const SURFACE: CSSProperties = {
  background:
    'radial-gradient(1200px 600px at 80% -10%, #1b2140 0%, transparent 60%),' +
    'radial-gradient(900px 500px at -10% 110%, #241436 0%, transparent 55%),' +
    'var(--bg)',
  color: 'var(--text)',
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  minHeight: '100%',
}

/**
 * The MemeOn app surface: the dark canvas and base text color every MemeOn
 * component is designed against, plus router context for the components that
 * render `<Link>`s.
 *
 * Wrap MemeOn UI in this. The components are **dark-only** — rendered on the
 * browser default white, chip and border treatments wash out to unreadable.
 */
export function MemeOnSurface({
  children,
  as: Tag = 'div',
  style,
}: {
  children: ReactNode
  /** element to render — use `main`/`section` when it isn't the page root */
  as?: 'div' | 'main' | 'section'
  style?: CSSProperties
}) {
  const c = useMemeOnSurface()
  const inner = <Tag style={{ ...SURFACE, ...style }}>{children}</Tag>
  return c.needsRouter ? <MemoryRouter>{inner}</MemoryRouter> : inner
}
