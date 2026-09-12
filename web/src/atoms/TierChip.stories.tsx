import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { TIERS } from '@memeon/shared/tiers'
import { TierChip } from './TierChip'

const meta = {
  title: 'Atoms/TierChip',
  component: TierChip,
  args: { tierKey: 'holo', label: 'Holo' },
} satisfies Meta<typeof TierChip>

export default meta
type Story = StoryObj<typeof meta>

/** The whole ladder at both sizes — the cheapest guard against two rungs collapsing into one. */
export const All: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {TIERS.map((tier) => (
            <TierChip key={tier.key} tierKey={tier.key} label={tier.name} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // seven tiers, two sizes, and every chip says its own product name
    await expect(canvas.getAllByText('Prismatic')).toHaveLength(2)
    const [paper] = canvas.getAllByText('Paper')
    await expect(paper?.dataset.tier).toBe('paper')
  },
}

/** An unknown key is a data problem, not a render problem: it wears Paper rather than nothing. */
export const UnknownTier: Story = {
  args: { tierKey: 'wildcard', label: 'Wildcard' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Wildcard')).toHaveClass('bg-tier-paper-chip')
  },
}

export const Dark: Story = { ...All, globals: { theme: 'dark' } }
