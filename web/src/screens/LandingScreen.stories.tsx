import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { tierFrames } from '../../.storybook/fixtures'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import { LandingScreen } from './LandingScreen'

const hero = (
  <div className="hero-video">
    <img src="/promo/memeon-promo-poster.jpg" alt="MemeOn in 50 seconds" />
  </div>
)

const handlers = {
  onLogin: fn(),
} satisfies Partial<LandingScreenModel>

const empty: LandingScreenModel = {
  phase: 'ready',
  frames: {},
  busy: false,
  err: null,
  showMarketplaceCta: false,
  showLoginButton: true,
  showErr: false,
  loginLabel: '🎭 Log in with Masky',
  hero,
  ...handlers,
}

const meta = {
  title: 'Screens/LandingScreen',
  component: LandingScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LandingScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', frames: {}, showLoginButton: true },
}

export const Ready: Story = {
  args: { phase: 'ready', frames: tierFrames },
}

export const LoggedIn: Story = {
  args: {
    phase: 'ready',
    frames: tierFrames,
    showMarketplaceCta: true,
    showLoginButton: false,
  },
}

export const LoggingIn: Story = {
  args: {
    phase: 'loggingIn',
    frames: tierFrames,
    busy: true,
    loginLabel: 'Redirecting…',
  },
}

export const LoginError: Story = {
  args: {
    phase: 'loginError',
    frames: tierFrames,
    err: 'login failed',
    showErr: true,
  },
}
