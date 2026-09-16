import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '@/atoms/button'

/** A token as `:root` declares it, so the assertion follows the scale rather than pinning a literal. */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

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
    await expect(button).toHaveAttribute('data-slot', 'button')
    await expect(button).toHaveAttribute('type', 'button')
    await expect(button.offsetHeight).toBe(46)
    await expect(getComputedStyle(button).borderRadius).toBe(token('--radius-lg'))
  },
}
export const Primary: Story = { args: { variant: 'primary' } }

/** The ultraviolet companion — a second action on a card that must not spend the bubblegum. */
export const Brand: Story = { args: { variant: 'brand', children: 'Show more brains' } }
export const Destructive: Story = { args: { variant: 'destructive', children: '🗑️ Delete forever' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Skip for now' } }
export const LinkVariant: Story = { args: { variant: 'link', children: 'Read the rules' } }

/** The sign-in CTA is a size, not a colour: primary, full width on the phone, wraps its label. */
export const Login: Story = {
  args: { variant: 'primary', size: 'login', children: 'Continue with Discord' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Continue with Discord' })
    await expect(button.offsetHeight).toBeGreaterThanOrEqual(46)
    await expect(getComputedStyle(button).whiteSpace).toBe('normal')
  },
}

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

/** The size axis: control (46), row action (40), chip (34) and the two square icon boxes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16 }}>
      <Button>Default</Button>
      <Button size="sm">Small</Button>
      <Button size="xs">Chip</Button>
      <Button size="icon" aria-label="Settings">
        ⚙️
      </Button>
      <Button size="icon-sm" aria-label="Close">
        ✕
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Default' }).offsetHeight).toBe(46)
    await expect(canvas.getByRole('button', { name: 'Small' }).offsetHeight).toBe(40)
    await expect(canvas.getByRole('button', { name: 'Chip' }).offsetHeight).toBe(34)
    const icon = canvas.getByRole('button', { name: 'Settings' })
    await expect(icon.offsetWidth).toBe(46)
    await expect(icon.offsetHeight).toBe(46)
    const iconSm = canvas.getByRole('button', { name: 'Close' })
    await expect(iconSm.offsetWidth).toBe(34)
    await expect(getComputedStyle(iconSm).borderRadius).toBe(token('--radius-sm'))
  },
}

/** Every variant in one row, which is also the dark twin's subject. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16 }}>
      <Button>Load more</Button>
      <Button variant="primary">＋ Mint a meme</Button>
      <Button variant="brand">Show more brains</Button>
      <Button variant="destructive">🗑️ Delete forever</Button>
      <Button variant="mint">＋ Mint</Button>
      <Button variant="ghost">Skip for now</Button>
      <Button variant="link">Read the rules</Button>
      <Button pressed>All memes</Button>
      <Button disabled>Unavailable</Button>
      <Button variant="primary" busy>
        Minting…
      </Button>
      <Button variant="primary" size="login">
        Log in with Masky
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(11)
  },
}

/** The glass pills a film wears, the segment chip that grows on a phone, and the picture cell. */
export const GlassCellAndSegment: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="glass" size="pill">
        ▶ Play
      </Button>
      <Button variant="glass" size="pill-sm">
        Sound on
      </Button>
      <Button size="segment">🎨 Generate</Button>
      <Button variant="cell" size="cell" pressed aria-label="Pick this picture" className="w-20">
        <span aria-hidden="true">🖼️</span>
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="button"]')
    await expect(buttons).toHaveLength(4)
    await expect(buttons[3]).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Dark: Story = { ...Variants, globals: { theme: 'dark' } }

/**
 * The pill on a link: Base UI's `render` swaps the element, `nativeButton={false}` tells it the
 * element is not a `<button>`. The anchor is announced as a button, which is Base UI's contract.
 */
export const AsLink: Story = {
  render: () => (
    <Button variant="primary" render={<a href="/marketplace" />} nativeButton={false}>
      Browse the marketplace
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('button', { name: 'Browse the marketplace' })
    await expect(link.tagName).toBe('A')
    await expect(link).toHaveAttribute('href', '/marketplace')
    await expect(link).toHaveAttribute('data-slot', 'button')
  },
}

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
 * opacity the moment it goes busy. `disabled-look` carries an attribute-selector specificity
 * bump that would otherwise outrank a plain `opacity-100`, so busy must win with `!`.
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
