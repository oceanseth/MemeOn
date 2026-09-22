import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Icon, ICON_NAMES } from '@/atoms/icon'

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
        background: 'var(--color-background)',
        color: 'var(--color-foreground)',
      }}
    >
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name={name} size={22} />
          <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>{name}</span>
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

/** Empty-disc medal at the sizes the live podium and the 16px row actually use. */
export const Medal: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Icon name="medal" size={16} />
      <Icon name="medal" size={28} />
      <Icon name="medal" size={48} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const PIP = 'M12 18v-2h-.5'
    const svgs = canvasElement.querySelectorAll('[data-slot="icon"]')
    await expect(svgs).toHaveLength(3)
    for (const svg of svgs) {
      const ds = [...svg.querySelectorAll('path')].map((path) => path.getAttribute('d'))
      for (const d of ds) {
        await expect(d).not.toBe(PIP)
      }
      await expect(ds).toHaveLength(5)
      await expect(ds).toContain('M 7 17 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0')
    }
  },
}

export const MedalDark: Story = { ...Medal, globals: { theme: 'dark' } }

const REMAINDER = [
  'globe',
  'mail',
  'film',
  'playing-card',
  'gift',
  'square',
  'square-play',
  'theater',
  'satellite',
  'handshake',
  'contrast',
] as const

const REMAINDER_LIVE: Record<(typeof REMAINDER)[number], readonly number[]> = {
  globe: [16],
  mail: [16],
  film: [16],
  'playing-card': [18],
  gift: [16],
  square: [18],
  'square-play': [20],
  theater: [16],
  satellite: [16],
  handshake: [16, 18],
  contrast: [16, 22],
}

const REMAINDER_SURVEY = [16, 28, 48] as const

const remainderCount =
  REMAINDER.reduce((n, name) => n + REMAINDER_LIVE[name].length, 0) +
  REMAINDER.length * REMAINDER_SURVEY.length

/** Remainder family at live call sizes, then the 16/28/48 survey. */
export const Remainder: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: 20,
        background: 'var(--color-background)',
        color: 'var(--color-foreground)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'flex-end',
        }}
      >
        {REMAINDER.flatMap((name) =>
          REMAINDER_LIVE[name].map((size) => (
            <div
              key={`${name}-live-${size}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name={name} size={size} />
              <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>
                {name} {size}
              </span>
            </div>
          )),
        )}
      </div>
      {REMAINDER_SURVEY.map((size) => (
        <div
          key={size}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-end',
          }}
        >
          {REMAINDER.map((name) => (
            <div
              key={`${name}-${size}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name={name} size={size} />
              <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>
                {name} {size}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const icons = canvasElement.querySelectorAll('[data-slot="icon"]')
    await expect(icons).toHaveLength(remainderCount)
  },
}

export const RemainderDark: Story = { ...Remainder, globals: { theme: 'dark' } }
