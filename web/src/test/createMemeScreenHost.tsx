import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, vi } from 'vitest'
import { CreateMemeRoute } from '../views/AppView'
import { button as findButton, change as changeControl, click } from './dom'
import { macrotask, settle } from './runtime'

export type CreationVariant = 'mint' | 'lifetime'

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}

function CreationRoutes({ variant }: { variant: CreationVariant }) {
  if (variant === 'lifetime') {
    return (
      <>
        <nav>
          <Link to="/binder/new?remix=remix-a">Remix A</Link>
          <Link to="/binder/new?remix=remix-b">Remix B</Link>
          <Link to="/away">Away</Link>
        </nav>
        <Routes>
          <Route path="/binder/new" element={<CreateMemeRoute />} />
          <Route path="/away" element={<p>Elsewhere</p>} />
        </Routes>
      </>
    )
  }
  return (
    <>
      <Routes>
        <Route path="/binder/new" element={<CreateMemeRoute />} />
        <Route path="/m/:id" element={null} />
      </Routes>
      <CurrentRoute />
    </>
  )
}

export function createMemeScreenHost(variant: CreationVariant) {
  let host!: HTMLDivElement
  let root!: Root

  beforeEach(async () => {
    /* the route view is lazy: pull its module in before any test installs fake timers */
    await import('../views/CreateMemeView')
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    sessionStorage.clear()
  })

  afterEach(async () => {
    await act(() => root.unmount())
    host.remove()
    sessionStorage.clear()
    localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function renderAt(
    entry = '/binder/new',
    options: { strict?: boolean; variant?: CreationVariant } = {},
  ): Promise<void> {
    const routesVariant = options.variant ?? variant
    const routes = <CreationRoutes variant={routesVariant} />
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[entry]}>
          {options.strict ? <StrictMode>{routes}</StrictMode> : routes}
        </MemoryRouter>,
      )
      await settle()
    })
    /* the route view is lazy: wait for the mounted form rather than guessing a tick count */
    for (
      let attempt = 0;
      attempt < 20 && !host.querySelector('[data-slot="form-grid"]');
      attempt += 1
    ) {
      await act(async () => {
        await macrotask()
        await settle()
      })
    }
  }

  return {
    get host() {
      return host
    },
    renderAt,
    button(label: string, occurrence: 'first' | 'last' = 'first') {
      return findButton(label, host, occurrence)
    },
    click,
    change: changeControl,
  }
}
