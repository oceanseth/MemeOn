import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { TIERS } from '@memeon/shared/tiers'
import { tierFrames } from '../../.storybook/fixtures'
import { buttonVariants } from '@/atoms/button'
import { Icon } from '@/atoms/icon'
import { LandingHero } from '@/organisms/landing-hero'
import { landingCopy as copy } from '../copy/landing'
import {
  buildLandingHeroCards,
  type LandingFrameSlotState,
  type LandingScreenModel,
} from '../hooks/useLandingScreen'

const handlers = { onLogin: fn(), onFrameError: fn() }

const slots = (state: LandingFrameSlotState): LandingScreenModel['frameSlotProps'] =>
  Object.fromEntries(
    TIERS.map((tier) => [
      tier.key,
      { 'data-state': state, style: { color: `var(--tier-${tier.key}-frame)` } },
    ]),
  )

const readyFrames: LandingScreenModel['frameImageProps'] = Object.fromEntries(
  TIERS.map((tier) => [
    tier.key,
    { src: tierFrames[tier.key], alt: '', loading: 'lazy', onError: handlers.onFrameError },
  ]),
)

const cta = (
  <Link className={buttonVariants({ variant: 'primary', size: 'login' })} to="/marketplace">
    <span aria-hidden="true">
      <Icon name="playing-card" size={18} />
    </span>{' '}
    {copy.marketplaceCta}
  </Link>
)

const ready = {
  err: null,
  showMarketplaceCta: false,
  showLoginButton: true,
  showErr: false,
  loginLabel: copy.login.label,
  loginAside: copy.hero.loginAside,
  heroTitle: copy.hero.title,
  heroBody: copy.hero.body,
  heroCards: buildLandingHeroCards(),
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': copy.login.name,
  },
  frameImageProps: readyFrames,
  frameSlotProps: slots('ready'),
  errorNoticeProps: { role: 'alert' as const },
  cta,
}

const meta = {
  title: 'Organisms/LandingHero',
  component: LandingHero,
  args: ready,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LandingHero>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: copy.hero.title })).toBeInTheDocument()
    const pile = canvasElement.querySelector<HTMLElement>('[data-slot="hero-pile"]')!
    await expect(pile.querySelectorAll('[data-slot="hero-card"]')).toHaveLength(3)
    await expect(canvas.getByRole('button', { name: copy.login.name })).toBeInTheDocument()
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
