import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { TIERS } from '@memeon/shared/tiers'
import { tierFrames } from '../../.storybook/fixtures'
import { landingCopy as copy } from '../copy/landing'
import {
  buildLandingHeroCards,
  type LandingFrameSlotState,
  type LandingScreenModel,
} from '../hooks/useLandingScreen'
import { buttonVariants } from '@/atoms/button'
import { LandingHero } from '@/organisms/landing-hero'
import '../screens/LandingScreen.css'

const handlers = { onLogin: fn(), onFrameError: fn() }

const slots = (state: LandingFrameSlotState): LandingScreenModel['frameSlotProps'] =>
  Object.fromEntries(
    TIERS.map((tier) => [
      tier.key,
      {
        'data-state': state,
        style: { color: `var(--tier-${tier.key}-frame)` },
      },
    ]),
  )

const readyFrames: LandingScreenModel['frameImageProps'] = Object.fromEntries(
  TIERS.map((tier) => [
    tier.key,
    {
      src: tierFrames[tier.key],
      alt: '',
      loading: 'lazy',
      onError: handlers.onFrameError,
    },
  ]),
)

const marketplaceCta = (
  <a className={buttonVariants({ variant: 'primary', size: 'login' })} href="/marketplace">
    {copy.marketplaceCta}
  </a>
)

const idleLogin = {
  loginLabel: copy.login.label,
  loginAside: copy.hero.loginAside,
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': copy.login.name,
  },
  errorNoticeProps: { role: 'alert' as const },
}

const meta = {
  title: 'Organisms/LandingHero',
  component: LandingHero,
  args: {
    heroTitle: copy.hero.title,
    heroBody: copy.hero.body,
    showMarketplaceCta: false,
    showLoginButton: true,
    showErr: false,
    err: null,
    heroCards: buildLandingHeroCards(),
    frameImageProps: readyFrames,
    frameSlotProps: slots('ready'),
    marketplaceCta,
    ...idleLogin,
  },
} satisfies Meta<typeof LandingHero>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="landing-hero"]')).toBeInTheDocument()
    const pile = canvasElement.querySelector<HTMLElement>('[data-slot="hero-pile"]')!
    await expect(pile.querySelectorAll('[data-slot="hero-card"]')).toHaveLength(3)
  },
}

export const Loading: Story = {
  args: { frameImageProps: {}, frameSlotProps: slots('loading') },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll('[data-slot="hero-card-slot"][data-state="loading"]'),
    ).toHaveLength(3)
  },
}

export const LoggedIn: Story = {
  args: { showMarketplaceCta: true, showLoginButton: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: copy.marketplaceCta })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: copy.login.name })).not.toBeInTheDocument()
  },
}

export const LoginError: Story = {
  args: { err: copy.errors.login, showErr: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(copy.errors.login)
  },
}

export const Dark: Story = { ...Ready, globals: { theme: 'dark' } }
