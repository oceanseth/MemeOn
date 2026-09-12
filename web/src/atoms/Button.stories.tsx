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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Do the thing' })
    await expect(button.offsetHeight).toBe(46)
    await expect(getComputedStyle(button).borderRadius).toBe('23px')
  },
}
export const Primary: Story = { args: { variant: 'primary' } }

/** The ultraviolet companion — a second action on a card that must not spend the bubblegum. */
export const Secondary: Story = { args: { variant: 'secondary', children: 'Show more brains' } }
export const Danger: Story = { args: { variant: 'danger', children: '🗑️ Delete forever' } }
export const Login: Story = { args: { variant: 'login', children: 'Continue with Discord' } }

/**
 * A toggle or tab that is on: the pressed well instead of the raised pill, announced with
 * `aria-pressed` so the state is not only a colour.
 */
export const Pressed: Story = {
  args: { pressed: true, children: 'All memes' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'All memes', pressed: true })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    // the pressed material is a well, so the relief runs inset-first
    await expect(getComputedStyle(button).boxShadow).toContain('inset')
  },
}

/** Every variant in one row, which is also the dark twin's subject. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16 }}>
      <Button>Load more</Button>
      <Button variant="primary">＋ Mint a meme</Button>
      <Button variant="secondary">Show more brains</Button>
      <Button variant="danger">🗑️ Delete forever</Button>
      <Button pressed>All memes</Button>
      <Button disabled>Unavailable</Button>
      <Button variant="primary" busy>
        Minting…
      </Button>
      <Button variant="login">Log in with Masky</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(8)
  },
}

export const Dark: Story = { ...Variants, globals: { theme: 'dark' } }

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
 * instead of passing `busy` (see hooks/*Screen.ts, lib/tradeCardModel.ts). The atom must
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

/**
 * Real call sites (InviteScreen, ProfileScreen) spread both `aria-disabled` and `aria-busy` while
 * a request is in flight — a button that is disabled-looking at rest but must read at full
 * opacity the moment it goes busy. BASE's `aria-disabled:opacity-*` carries an attribute-selector
 * specificity bump that would otherwise outrank a plain `opacity-100`, so busy must win with `!`.
 */
export const BusyWhileAriaDisabled: Story = {
  args: { variant: 'primary', busy: true, 'aria-disabled': true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Do the thing' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await expect(getComputedStyle(button).opacity).toBe('1')
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
