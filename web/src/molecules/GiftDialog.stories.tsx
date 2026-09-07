import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper, giftableSilver } from '../../.storybook/fixtures'
import { GiftDialog } from './GiftDialog'

const recipient = { sub: friendAccepted.sub, name: friendAccepted.name }

const meta = {
  title: 'Molecules/GiftDialog',
  component: GiftDialog,
  args: {
    open: true,
    recipient,
    memes: [giftablePaper, giftableSilver],
    query: '',
    onQueryChange: fn(),
    pick: null,
    onPick: fn(),
    shares: 1,
    onSharesChange: fn(),
    busy: false,
    error: null,
    onClose: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof GiftDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {}
export const EmptyBinder: Story = { args: { memes: [] } }
export const Filtered: Story = { args: { query: 'silver' } }
export const Picked: Story = { args: { pick: giftablePaper, shares: 3 } }
export const Busy: Story = { args: { pick: giftablePaper, shares: 3, busy: true } }
export const Error: Story = {
  args: { pick: giftablePaper, shares: 3, error: 'not enough shares' },
}
export const Closed: Story = { args: { open: false } }
