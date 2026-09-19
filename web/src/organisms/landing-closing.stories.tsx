import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { landingCopy as copy } from '../copy/landing'
import { buttonVariants } from '@/atoms/button'
import { LandingClosing } from '@/organisms/landing-closing'

const handlers = { onLogin: fn() }

const marketplaceCta = (
  <a className={buttonVariants({ variant: 'primary', size: 'login' })} href="/marketplace">
    {copy.marketplaceCta}
  </a>
)

const meta = {
  title: 'Organisms/LandingClosing',
  component: LandingClosing,
  args: {
    showMarketplaceCta: false,
    showLoginButton: true,
    closingLine: copy.closing.lineLoggedOut,
    closingLoginLabel: copy.closing.label,
    closingLoginButtonProps: {
      onClick: handlers.onLogin,
      disabled: false,
      'aria-busy': false,
      'aria-label': copy.closing.name,
    },
    marketplaceCta,
  },
} satisfies Meta<typeof LandingClosing>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelector('[data-slot="landing-closing"]')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: copy.closing.name })).toBeInTheDocument()
  },
}

export const LoggedIn: Story = {
  args: {
    showMarketplaceCta: true,
    showLoginButton: false,
    closingLine: copy.closing.lineLoggedIn,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: copy.marketplaceCta })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: copy.closing.name })).not.toBeInTheDocument()
  },
}

export const Dark: Story = { ...LoggedOut, globals: { theme: 'dark' } }
