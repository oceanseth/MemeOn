import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import { TIERS } from '../../../shared/tiers'
import { tierFrames } from '../../.storybook/fixtures'
import { buildLandingTierModels, type LandingScreenModel } from '../hooks/useLandingScreen'
import { LandingScreen } from './LandingScreen'

const hero = (
  <div className="hero-video">
    <img src="/promo/memeon-promo-poster.jpg" alt="MemeOn in 50 seconds" />
  </div>
)

const handlers = {
  onLogin: fn(),
}

const empty: LandingScreenModel = {
  phase: 'ready',
  err: null,
  showMarketplaceCta: false,
  showLoginButton: true,
  showErr: false,
  loginLabel: '🎭 Log in with Masky',
  hero,
  tiers: buildLandingTierModels(),
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': 'Log in with Masky',
  },
  frameImageProps: {},
  errorNoticeProps: { role: 'alert' },
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
  args: { phase: 'loading', frameImageProps: {}, showLoginButton: true },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    frameImageProps: Object.fromEntries(TIERS.map((tier) => [
      tier.key,
      {
        src: tierFrames[tier.key],
        alt: `${tier.name} frame`,
        loading: 'lazy',
        onError: (event) => { event.currentTarget.style.display = 'none' },
      },
    ])),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Common · 0+ views')).toBeInTheDocument()
    await expect(canvas.getByText('Legendary · 1,000+ views')).toBeInTheDocument()
    await expect(canvas.getByText('Mythic Shiny · 25,000+ views')).toBeInTheDocument()
    const login = canvas.getByRole('button', { name: 'Log in with Masky' })
    await expect(login).toHaveAttribute('aria-busy', 'false')
    const frame = canvas.getByAltText('Paper frame')
    await fireEvent.error(frame)
    await expect(frame).toHaveStyle({ display: 'none' })
    await userEvent.click(login)
    await expect(handlers.onLogin).toHaveBeenCalledOnce()
  },
}

export const LoggedIn: Story = {
  args: {
    phase: 'ready',
    showMarketplaceCta: true,
    showLoginButton: false,
  },
}

export const LoggingIn: Story = {
  args: {
    phase: 'loggingIn',
    loginLabel: 'Redirecting…',
    loginButtonProps: {
      onClick: handlers.onLogin,
      disabled: true,
      'aria-busy': true,
      'aria-label': 'Redirecting to Masky',
    },
  },
}

export const LoggingInWhileFramesLoad: Story = {
  args: {
    phase: 'loggingIn',
    frameImageProps: {},
    loginLabel: 'Redirecting…',
    loginButtonProps: {
      onClick: handlers.onLogin,
      disabled: true,
      'aria-busy': true,
      'aria-label': 'Redirecting to Masky',
    },
  },
}

export const LoginError: Story = {
  args: {
    phase: 'loginError',
    err: 'login failed',
    showErr: true,
  },
}

export const LoginErrorWhileFramesLoad: Story = {
  args: {
    phase: 'loginError',
    frameImageProps: {},
    err: 'Masky is unavailable. Try again.',
    showErr: true,
  },
}
