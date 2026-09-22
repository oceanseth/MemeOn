import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TIERS } from '@memeon/shared/tiers'
import { heroVideoCopy } from '../copy/heroVideo'
import { landingCopy as copy } from '../copy/landing'
import {
  buildLandingFaqItems,
  buildLandingHeroCards,
  buildLandingHeroStats,
  buildLandingHowSteps,
  type LandingScreenModel,
} from '../hooks/useLandingScreen'
import { buildHeroVideoModel } from '../lib/heroVideoModel'
import { LandingScreen } from './LandingScreen'

const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const handlers = {
  onLogin: fn(),
  attachVideo: fn(),
  onStart: fn(),
  onToggleSound: fn(),
}

const heroVideo = buildHeroVideoModel({
  autoplay: false,
  muted: true,
  started: false,
  attachVideo: handlers.attachVideo,
  onStart: handlers.onStart,
  onToggleSound: handlers.onToggleSound,
})

const empty: LandingScreenModel = {
  phase: 'ready',
  err: null,
  showMarketplaceCta: false,
  showLoginButton: true,
  showErr: false,
  loginLabel: copy.login.label,
  loginAside: copy.hero.loginAside,
  marketplaceCta: copy.marketplaceCta,
  closingLine: copy.closing.lineLoggedOut,
  closingLoginLabel: copy.closing.label,
  heroTitle: copy.hero.title,
  heroBody: copy.hero.body,
  heroCards: buildLandingHeroCards(),
  heroStats: buildLandingHeroStats(),
  howTitle: copy.how.title,
  howSteps: buildLandingHowSteps(),
  filmTitle: copy.film.title,
  faqTitle: copy.faq.title,
  faqItems: buildLandingFaqItems(),
  heroVideo,
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': copy.login.name,
  },
  closingLoginButtonProps: {
    onClick: handlers.onLogin,
    disabled: false,
    'aria-busy': false,
    'aria-label': copy.closing.name,
  },
  errorNoticeProps: { role: 'alert' },
}

const busyLogin = {
  loginLabel: copy.login.busyLabel,
  closingLoginLabel: copy.closing.busyLabel,
  loginButtonProps: {
    onClick: handlers.onLogin,
    disabled: true,
    'aria-busy': true,
    'aria-label': copy.login.busyName,
  },
  closingLoginButtonProps: {
    onClick: handlers.onLogin,
    disabled: true,
    'aria-busy': true,
    'aria-label': copy.closing.busyName,
  },
} satisfies Partial<LandingScreenModel>

const meta = {
  title: 'Screens/LandingScreen',
  component: LandingScreen,
  args: empty,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LandingScreen>

export default meta
type Story = StoryObj<typeof meta>

/** Everything below the hero, plus the two sign-in buttons; the hero's captions differ by width. */
async function expectLandingBody(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const hero = canvasElement.querySelector<HTMLElement>('[data-slot="landing-hero"]')!
  const cards = within(hero).getAllByRole('listitem')
  await expect(cards).toHaveLength(TIERS.length)
  await expect(canvasElement.querySelector('[data-slot="landing-tiers"]')).toBeNull()

  const how = within(canvasElement.querySelector<HTMLElement>('[data-slot="landing-how"]')!)
  await expect(how.getAllByRole('listitem')).toHaveLength(3)
  await expect(
    how.getByRole('heading', { level: 3, name: copy.how.steps[0].title }),
  ).toBeInTheDocument()

  const film = canvasElement.querySelector<HTMLElement>('[data-slot="landing-film"]')!
  await expect(
    within(film).getByRole('heading', { level: 2, name: copy.film.title }),
  ).toBeInTheDocument()
  await expect(film.querySelector('video')).toHaveAttribute(
    'poster',
    '/promo/memeon-promo-poster.jpg',
  )
  await expect(within(film).getByRole('button', { name: heroVideoCopy.play })).toBeInTheDocument()
  await expect(film.previousElementSibling).toBe(
    canvasElement.querySelector('[data-slot="landing-how"]'),
  )

  const login = canvas.getByRole('button', { name: copy.login.name })
  await expect(login).toBeEnabled()
  const closing = canvas.getByRole('button', { name: copy.closing.name })
  await userEvent.click(login)
  await userEvent.click(closing)
  await expect(handlers.onLogin).toHaveBeenCalledTimes(2)
  const page = document.scrollingElement as HTMLElement
  await expect(page.scrollWidth).toBe(page.clientWidth)
}

/** The phone keeps the fan but only the centre seat's caption (`landing-hero.css`). */
const phonePlay: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByText(copy.tier.reshares(250))).toBeVisible()
  await expect(canvas.getByText(copy.tier.reshares(0))).not.toBeVisible()
  await expect(canvas.getByText(copy.tier.reshares(25_000))).not.toBeVisible()
  await expectLandingBody(canvasElement)
}

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.tier.reshares(0))).toBeVisible()
    await expect(canvas.getByText(copy.tier.reshares(25_000))).toBeVisible()
    await expect(canvas.getByText('Mythic Shiny')).toBeVisible()
    await expectLandingBody(canvasElement)
  },
}


export const Dark: Story = { ...Ready, globals: { theme: 'dark' } }
export const Phone390: Story = { play: phonePlay, ...phone }
export const DarkPhone390: Story = {
  play: phonePlay,
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const LoggedIn: Story = {
  args: {
    showMarketplaceCta: true,
    showLoginButton: false,
    closingLine: copy.closing.lineLoggedIn,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('link', { name: copy.marketplaceCta })).toHaveLength(2)
    await expect(canvas.queryByRole('button', { name: copy.login.name })).not.toBeInTheDocument()
  },
}

export const LoggingIn: Story = {
  args: { phase: 'loggingIn', ...busyLogin },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.login.busyName })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: copy.closing.busyName })).toBeDisabled()
  },
}

export const LoginError: Story = {
  args: { phase: 'loginError', err: copy.errors.login, showErr: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(copy.errors.login)
  },
}

export const LoginErrorDark: Story = { ...LoginError, globals: { theme: 'dark' } }
