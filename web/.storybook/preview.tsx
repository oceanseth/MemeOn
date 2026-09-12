import type { Preview } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import MockDate from 'mockdate'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import '../src/index.css'
import { useMountEffect } from '../src/hooks/useMountEffect'
import { createStores } from '../src/stores/createStores'
import { StoresProvider } from '../src/stores/StoresContext'
import { THEME_STORAGE_KEY } from '../src/stores/themeStore'
import { FIXED_NOW } from './fixtures'
import { connectedHandlers } from './msw-handlers'
import type { UnexpectedRequestLedger } from './request-accounting'
import type { ConnectedScenario } from './connected-scenario'

const connectedMswLoader = mswLoader(async () => {
  const worker = setupWorker(...connectedHandlers)
  await worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/api/')) print.error()
    },
  })
  return worker
})

/** The `theme` toolbar global, narrowed: anything but `dark` is the light arm. */
const storyTheme = (globals: Record<string, unknown>): 'light' | 'dark' =>
  globals.theme === 'dark' ? 'dark' : 'light'

function FreshStores({ children }: { children: ReactNode }) {
  const [stores] = useState(() => createStores())
  useMountEffect(() => {
    stores.retain()
    return () => stores.dispose()
  })
  return <StoresProvider stores={stores}>{children}</StoresProvider>
}

const preview: Preview = {
  loaders: [connectedMswLoader],
  globalTypes: {
    theme: {
      description: 'Soft Press theme arm',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  beforeEach: ({ globals }) => {
    MockDate.set(FIXED_NOW)
    localStorage.clear()
    sessionStorage.clear()
    // The bag's ThemeStore paints <html> from storage when it is retained (after the decorator
    // below has already set it), so the toolbar's arm is seeded as the persisted device choice and
    // the two agree. A story that wants `auto` removes the key in its own beforeEach.
    localStorage.setItem(THEME_STORAGE_KEY, storyTheme(globals))
    const originalClipboard = navigator.clipboard
    const originalShare = navigator.share
    const OriginalIntersectionObserver = window.IntersectionObserver
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => {
        const { getActiveScenario } = await import('./connected-scenario')
        getActiveScenario().copied.push(value)
      } },
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        const { getActiveScenario } = await import('./connected-scenario')
        getActiveScenario().shared.push(data)
      },
    })
    class StoryIntersectionObserver implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = '0px'
      readonly thresholds = [0]
      constructor(callback: IntersectionObserverCallback) {
        void import('./connected-scenario')
          .then(({ getActiveScenario }) => {
            getActiveScenario().intersectionObservers.push((entries) => callback(entries, this))
          })
          // an atom story never starts a scenario, and every Base UI popup builds an observer:
          // no scenario to report into means an inert observer, not a failed story
          .catch(() => {})
      }
      disconnect() {}
      observe() {}
      takeRecords() { return [] }
      unobserve() {}
    }
    window.IntersectionObserver = StoryIntersectionObserver
    return () => {
      MockDate.reset()
      localStorage.clear()
      sessionStorage.clear()
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard })
      Object.defineProperty(navigator, 'share', { configurable: true, value: originalShare })
      window.IntersectionObserver = OriginalIntersectionObserver
    }
  },
  afterEach: ({ loaded }) => {
    ;(loaded.scenario as ConnectedScenario | undefined)?.assertNoUnexpectedRequests()
    ;(loaded.requestGuard as UnexpectedRequestLedger | undefined)?.assertEmpty()
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Anatomy', 'Atoms', 'Molecules', 'Organisms', 'Screens', 'Views'],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Pin the arm on <html> before the story paints; `index.css` reads `data-theme` into
      // `color-scheme`, which is what resolves every `light-dark()` token.
      document.documentElement.dataset.theme = storyTheme(context.globals)
      return (
        <FreshStores key={context.id}>
          <Story />
        </FreshStores>
      )
    },
  ],
}

export default preview
