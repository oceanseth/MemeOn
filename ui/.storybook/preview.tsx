import type { Preview } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import '../src/styles.css'

/**
 * Every story renders on the MemeOn surface, inside a router.
 *
 * Both are real requirements of the design system, not harness convenience:
 * the components are dark-only (on white, chip and border treatments wash
 * out), and several render react-router <Link>s. /design-sync reads this file
 * to infer the same wrapping for its preview cards.
 */
const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div
          style={{
            background:
              'radial-gradient(1200px 600px at 80% -10%, #1b2140 0%, transparent 60%),' +
              'radial-gradient(900px 500px at -10% 110%, #241436 0%, transparent 55%),' +
              'var(--bg)',
            color: 'var(--text)',
            minHeight: '100vh',
            padding: 24,
          }}
        >
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export default preview
