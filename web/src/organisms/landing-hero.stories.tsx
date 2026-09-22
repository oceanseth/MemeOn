import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { landingCopy as copy } from '../copy/landing'
import { buildLandingHeroCards } from '../hooks/useLandingScreen'
import { buttonVariants } from '@/atoms/button'
import { LandingHero } from '@/organisms/landing-hero'

const handlers = { onLogin: fn() }

const marketplaceCta = (
  <a className={buttonVariants({ variant: 'primary', size: 'login' })} href="/marketplace">
    {copy.marketplaceCta}
  </a>
)

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
    marketplaceCta,
    loginLabel: copy.login.label,
    loginAside: copy.hero.loginAside,
    loginButtonProps: {
      onClick: handlers.onLogin,
      disabled: false,
      'aria-busy': false,
      'aria-label': copy.login.name,
    },
    errorNoticeProps: { role: 'alert' },
  },
} satisfies Meta<typeof LandingHero>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector<HTMLElement>('[data-slot="landing-hero"]')!
    const cards = hero.querySelectorAll('[data-slot="hero-card"]')
    await expect(cards).toHaveLength(7)
    await expect(within(hero).getByText('Shiny')).toBeVisible()
    for (const image of hero.querySelectorAll<HTMLImageElement>('[data-slot="meme-art"]')) {
      await expect(image).toHaveAttribute('src', '/brand/hero-cat.webp')
    }
    await expect(getComputedStyle(hero).borderRadius).not.toBe('0px')
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

export const Phone390: Story = {
  ...Ready,
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

export const Dark: Story = { ...Ready, globals: { theme: 'dark' } }
