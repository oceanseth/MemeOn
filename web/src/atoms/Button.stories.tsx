import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: { children: 'Do the thing', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Primary: Story = { args: { variant: 'primary' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Delete' } }
export const Login: Story = { args: { variant: 'login', children: 'Continue with Discord' } }

export const Busy: Story = {
  args: { variant: 'primary', busy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Do the thing' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
  },
}

/**
 * Every real call site spreads a legacy `{ 'aria-busy': boolean }` prop bag onto `<Button>`
 * instead of passing `busy` (see hooks/*Screen.ts, molecules/tradeCardModel.ts). The atom must
 * honour that spread form too — spinner, `aria-busy` attribute, and accessible name intact.
 */
export const BusyViaAriaBusyProp: Story = {
  args: { variant: 'primary', 'aria-busy': true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Do the thing' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
  },
}

/** Some call sites produce the string form (`'true'`/`'false'`) rather than a boolean. */
export const BusyViaAriaBusyStringProp: Story = {
  args: { variant: 'primary', 'aria-busy': 'true' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Do the thing' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button')).toBeDisabled()
  },
}

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByRole('button')).toHaveFocus()
  },
}
