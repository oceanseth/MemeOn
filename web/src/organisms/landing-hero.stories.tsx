import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { landingCopy as copy } from '../copy/landing'
import { buildLandingHeroCards, buildLandingHeroStats } from '../hooks/useLandingScreen'
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
    heroStats: buildLandingHeroStats(),
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
    const cards = hero.querySelectorAll<HTMLElement>('[data-slot="hero-card"]')
    await expect(cards).toHaveLength(7)
    await expect(within(hero).getByText('Shiny')).toBeVisible()
    // The ladder is seated as a fan: the centre card upright and in flow, the rest swung out
    // around it by `landing-hero.css`, nearer seats stacked on top.
    const seats = Array.from(cards, (card) => card.dataset.fan)
    await expect(seats).toEqual(['-3', '-2', '-1', '0', '1', '2', '3'])
    const [paper, , , chrome] = cards
    // A seat of 0 computes to the identity matrix; an outer seat to a rotation with a translation.
    await expect(getComputedStyle(chrome!).transform).toBe('matrix(1, 0, 0, 1, 0, 0)')
    await expect(getComputedStyle(paper!).transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)')
    await expect(Number(getComputedStyle(chrome!).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(paper!).zIndex),
    )
    await expect(within(hero).getByText(copy.hero.stats.tiers)).toBeVisible()
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

/** The phone keeps the deck and only the centre seat's caption; every seal still names its tier. */
export const Phone390: Story = {
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector<HTMLElement>('[data-slot="landing-hero"]')!
    const cards = hero.querySelectorAll<HTMLElement>('[data-slot="hero-card"]')
    await expect(cards).toHaveLength(7)
    const caption = (card: HTMLElement) => card.querySelector('[data-slot="hero-card-meta"]')!
    await expect(caption(cards[3]!)).toBeVisible()
    await expect(caption(cards[0]!)).not.toBeVisible()
    await expect(caption(cards[6]!)).not.toBeVisible()
    await expect(within(hero).getByRole('img', { name: /Shiny/ })).toBeInTheDocument()
  },
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

export const Dark: Story = { ...Ready, globals: { theme: 'dark' } }
