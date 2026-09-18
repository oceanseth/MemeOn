import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { MobileAuthForwardView } from './MobileAuthForwardView'

const meta = {
  title: 'Views/MobileAuthForwardView',
  component: MobileAuthForwardView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/auth/mobile?code=single-use-code&state=nonce&ignored=1']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MobileAuthForwardView>

export default meta
type Story = StoryObj<typeof meta>

/** The forward fires once on mount with only the OAuth keys; the same link stays tappable on screen. */
export const ForwardsIntoTheApp: Story = {
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MobileAuthForwardView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const deepLink = 'memeon://auth?code=single-use-code&state=nonce'
    await waitFor(() => expect(loaded.scenario.deepLinkForwards).toEqual([deepLink]))
    await expect(canvas.getByRole('heading', { name: 'Returning to the MemeOn app…' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Open MemeOn' })).toHaveAttribute('href', deepLink)
    await expect(canvas.getByRole('link', { name: 'Continue on the web' })).toHaveAttribute('href', '/')
    await expect(document.title).toBe('Returning to the app — MemeOn')
  },
}
