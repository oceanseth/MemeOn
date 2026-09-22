import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { TierSeal } from '@/atoms/tier-seal'

const meta = {
  title: 'Atoms/TierSeal',
  component: TierSeal,
  args: { tierKey: 'shiny', label: 'Shiny tier' },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TierSeal>

export default meta
type Story = StoryObj<typeof meta>

export const Shiny: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('img', { name: 'Shiny tier' })).toHaveAttribute(
      'data-tier',
      'shiny',
    )
  },
}

export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-5">
      {['paper', 'silver', 'holo', 'chrome', 'gold', 'prismatic', 'shiny'].map((tier) => (
        <TierSeal key={tier} tierKey={tier} label={`${tier} tier`} />
      ))}
    </div>
  ),
}

export const Dark: Story = { ...AllTiers, globals: { theme: 'dark' } }
