import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import type { AuthStatusScreenModel } from '../hooks/useAuthCallbackScreen'
import { AuthStatusScreen } from './AuthStatusScreen'

const completing: AuthStatusScreenModel = {
  phase: 'working',
  title: 'Completing Masky login…',
  subtitle: 'Taking you back to MemeOn.',
  error: null,
  primaryAction: null,
  fallback: {
    prompt: 'Taking longer than usual?',
    retry: { label: 'Try again', onClick: () => {} },
    home: { label: 'Back to MemeOn', to: '/' },
  },
}

const meta = {
  title: 'Screens/AuthStatusScreen',
  component: AuthStatusScreen,
  args: completing,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof AuthStatusScreen>

export default meta
type Story = StoryObj<typeof meta>

/** The OAuth callback while the code is being exchanged: ring, title, the patient prompt. */
export const Completing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Completing Masky login…' })).toBeInTheDocument()
    await expect(canvasElement.querySelector('[data-slot="auth-ring"]')).not.toBeNull()
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Back to MemeOn' })).toHaveAttribute('href', '/')
  },
}

/** The exchange failed: no ring, the failure title, the message in an error notice. */
export const LoginFailed: Story = {
  args: {
    phase: 'error',
    title: 'Masky login didn’t finish',
    subtitle: null,
    error: 'OAuth state mismatch — try again',
    fallback: { ...completing.fallback, prompt: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('OAuth state mismatch — try again')
    await expect(canvasElement.querySelector('[data-slot="auth-ring"]')).toBeNull()
    await expect(canvas.queryByText('Taking longer than usual?')).not.toBeInTheDocument()
  },
}

/** The mobile forward: the deep link is the page's one primary; the web is the quiet fallback. */
export const ReturningToApp: Story = {
  args: {
    title: 'Returning to the MemeOn app…',
    subtitle: 'Open the MemeOn app, or keep going on the web.',
    primaryAction: { label: 'Open MemeOn', href: 'memeon://auth?code=abc&state=xyz', icon: 'arrow-right' },
    fallback: {
      prompt: 'Nothing happened?',
      retry: null,
      home: { label: 'Continue on the web', to: '/' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Open MemeOn' })).toHaveAttribute('href', 'memeon://auth?code=abc&state=xyz')
    await expect(canvas.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Continue on the web' })).toHaveAttribute('href', '/')
  },
}
