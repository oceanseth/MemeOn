import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TIERS } from '../../../shared/tiers'
import { tierFrames } from '../../.storybook/fixtures'
import {
  buildLandingTierModels,
  type LandingFrameSlotState,
  type LandingScreenModel,
} from '../hooks/useLandingScreen'
import { LandingScreen } from './LandingScreen'

/** Structurally identical to HeroVideo's DOM, so the stories measure the real page. */
const hero = (
  <div data-slot="hero-video" className="mx-auto mt-1 mb-[30px] max-w-[1080px] px-4">
    <div data-slot="hero-video-frame" className="relative aspect-video overflow-hidden rounded-card border border-border bg-bg-card">
      <img
        className="block h-full w-full object-cover"
        src="/promo/memeon-promo-poster.jpg"
        alt="MemeOn in 50 seconds"
      />
    </div>
  </div>
)

const handlers = {
  onLogin: fn(),
  onFrameError: fn(),
}

const slots = (state: LandingFrameSlotState): LandingScreenModel['frameSlotProps'] =>
  Object.fromEntries(
    TIERS.map((tier) => [tier.key, { 'data-state': state, style: { color: tier.color } }]),
  )

const readyFrames: LandingScreenModel['frameImageProps'] = Object.fromEntries(
  TIERS.map((tier) => [
    tier.key,
    { src: tierFrames[tier.key], alt: '', loading: 'lazy', onError: handlers.onFrameError },
  ]),
)

const empty: LandingScreenModel = {
  phase: 'ready',
  err: null,
  showMarketplaceCta: false,
  showLoginButton: true,
  showErr: false,
  loginLabel: '🎭 Log in with Masky',
  closingLine: 'Ready? Your first pack is free.',
  closingLoginLabel: '🎭 Grab your pack with Masky',
  hero,
  tiers: buildLandingTierModels(),
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': 'Log in with Masky',
  },
  closingLoginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': 'Grab your pack with Masky',
  },
  frameImageProps: {},
  frameSlotProps: slots('loading'),
  errorNoticeProps: { role: 'alert' },
}

const busyLogin = {
  loginLabel: 'Redirecting…',
  closingLoginLabel: 'Redirecting…',
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: true,
    'aria-busy': true,
    'aria-label': 'Redirecting to Masky',
  },
  closingLoginButtonProps: {
    onClick: handlers.onLogin,
    disabled: true,
    'aria-busy': true,
    'aria-label': 'Redirecting to Masky for your pack',
  },
} satisfies Partial<LandingScreenModel>

const meta = {
  title: 'Screens/LandingScreen',
  component: LandingScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LandingScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', frameImageProps: {}, frameSlotProps: slots('loading'), showLoginButton: true },
  play: async ({ canvasElement }) => {
    const shimmering = canvasElement.querySelectorAll('[data-slot="tier-frame-slot"][data-state="loading"]')
    await expect(shimmering).toHaveLength(TIERS.length)
    // the box is reserved before the images exist, so nothing below it moves later
    await expect((shimmering[0] as HTMLElement).offsetHeight).toBeGreaterThan(100)
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    frameImageProps: readyFrames,
    frameSlotProps: slots('ready'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Common · 0+ views')).toBeInTheDocument()
    await expect(canvas.getByText('Legendary · 1,000+ views')).toBeInTheDocument()
    await expect(canvas.getByText('Mythic Shiny · 25,000+ views')).toBeInTheDocument()
    // the ladder is an ordered list of headed cards, not seven anonymous boxes
    await expect(canvas.getAllByRole('listitem')).toHaveLength(TIERS.length)
    await expect(canvas.getByRole('heading', { level: 3, name: 'Shiny' })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { level: 3, name: 'How do tiers work?' })).toBeInTheDocument()
    const login = canvas.getByRole('button', { name: 'Log in with Masky' })
    // the Button atom omits aria-busy entirely when idle rather than writing "false"
    await expect(login).not.toHaveAttribute('aria-busy')
    await expect(login).toBeEnabled()
    await expect(canvas.getByText('No email. No real name. Just your Masky avatar.')).toBeInTheDocument()
    // the FAQ no longer ends the page: the CTA repeats under it
    const closing = canvas.getByRole('button', { name: 'Grab your pack with Masky' })
    await expect(canvas.getByText('Ready? Your first pack is free.')).toBeInTheDocument()
    const page = document.scrollingElement as HTMLElement
    await expect(page.scrollWidth).toBe(page.clientWidth)
    await userEvent.click(login)
    await userEvent.click(closing)
    await expect(handlers.onLogin).toHaveBeenCalledTimes(2)
  },
}

/** Both frame sources failed: the slot keeps the card's height and tints from the tier colour. */
export const FrameFailed: Story = {
  args: {
    phase: 'ready',
    frameImageProps: {},
    frameSlotProps: slots('error'),
  },
  play: async ({ canvasElement }) => {
    const failed = canvasElement.querySelectorAll('[data-slot="tier-frame-slot"][data-state="error"]')
    await expect(failed).toHaveLength(TIERS.length)
    await expect(canvasElement.querySelectorAll('[data-slot="tier-frame-img"]')).toHaveLength(0)
    const frames = canvasElement.querySelectorAll<HTMLElement>('[data-slot="tier-frame-slot"]')
    await expect(frames[0].offsetHeight).toBe(frames[6].offsetHeight)
  },
}

export const LoggedIn: Story = {
  args: {
    phase: 'ready',
    showMarketplaceCta: true,
    showLoginButton: false,
    closingLine: 'Your binder is waiting.',
    frameImageProps: readyFrames,
    frameSlotProps: slots('ready'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // both CTAs swap with the same state
    await expect(canvas.getAllByRole('link', { name: '📈 Enter the marketplace' })).toHaveLength(2)
    await expect(canvas.queryByRole('button', { name: 'Log in with Masky' })).not.toBeInTheDocument()
    await expect(canvas.getByText('Your binder is waiting.')).toBeInTheDocument()
  },
}

export const LoggingIn: Story = {
  args: {
    phase: 'loggingIn',
    frameImageProps: readyFrames,
    frameSlotProps: slots('ready'),
    ...busyLogin,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Redirecting to Masky' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Redirecting to Masky for your pack' })).toBeDisabled()
  },
}

export const LoggingInWhileFramesLoad: Story = {
  args: {
    phase: 'loggingIn',
    frameImageProps: {},
    frameSlotProps: slots('loading'),
    ...busyLogin,
  },
}

export const LoginError: Story = {
  args: {
    phase: 'loginError',
    frameImageProps: readyFrames,
    frameSlotProps: slots('ready'),
    err: "Masky didn't answer. Tap Log in with Masky to try again.",
    showErr: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the raw thrown string never reaches the page; the sentence names the retry
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      "Masky didn't answer. Tap Log in with Masky to try again.",
    )
  },
}

export const LoginErrorWhileFramesLoad: Story = {
  args: {
    phase: 'loginError',
    frameImageProps: {},
    frameSlotProps: slots('loading'),
    err: "Masky didn't answer. Tap Log in with Masky to try again.",
    showErr: true,
  },
}
