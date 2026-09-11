import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Icon, ICON_NAMES } from './Icon'

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  args: { name: 'storefront' },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('[data-slot="icon"]')
    await expect(svg).toHaveAttribute('aria-hidden', 'true')
  },
}

/** Every Central glyph the app has, at the 22px nav size, on the canvas colour. */
export const All: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        padding: 20,
        background: 'var(--color-canvas)',
        color: 'var(--color-ink)',
      }}
    >
      {ICON_NAMES.map((name) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Icon name={name} size={22} />
          <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const icons = canvasElement.querySelectorAll('[data-slot="icon"]')
    await expect(icons).toHaveLength(ICON_NAMES.length)
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Icon name="storefront" size={16} />
      <Icon name="storefront" size={20} />
      <Icon name="storefront" size={22} />
      <Icon name="storefront" size={32} />
    </div>
  ),
}

/** WP1 wires the `theme` global; this forces the dark twin so the grid renders on the dark canvas. */
export const Dark: Story = { ...All, globals: { theme: 'dark' } }
