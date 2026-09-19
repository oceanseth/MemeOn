import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { buttonVariants } from '@/atoms/button'
import { Icon } from '@/atoms/icon'
import { LandingClosing } from '@/organisms/landing-closing'
import { landingCopy as copy } from '../copy/landing'

const handlers = { onLogin: fn() }

const cta = (
  <Link className={buttonVariants({ variant: 'primary', size: 'login' })} to="/marketplace">
    <span aria-hidden="true">
      <Icon name="playing-card" size={18} />
    </span>{' '}
    {copy.marketplaceCta}
  </Link>
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
    cta,
  },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LandingClosing>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.closing.lineLoggedOut)).toBeInTheDocument()
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
    await expect(canvas.getByText(copy.closing.lineLoggedIn)).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: copy.marketplaceCta })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: copy.closing.name })).not.toBeInTheDocument()
  },
}
