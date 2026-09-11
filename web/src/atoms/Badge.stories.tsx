import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  args: { children: 'new' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const State: Story = { args: { state: true, children: 'Friends' } }

/** The six tones, in the order a screen reaches for them. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 16 }}>
      <Badge>12 held</Badge>
      <Badge tone="action">For sale</Badge>
      <Badge tone="success">Minted</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="error">Failed</Badge>
      <Badge tone="info">Friends</Badge>
      <Badge>🙈 private</Badge>
    </div>
  ),
}

export const Dark: Story = { ...Tones, globals: { theme: 'dark' } }
