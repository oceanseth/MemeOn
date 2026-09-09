import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper, giftableSilver } from '../../.storybook/fixtures'
import { buildGiftDialogModel } from '../lib/giftDialogModel'
import { GiftDialog } from './GiftDialog'

const recipient = { sub: friendAccepted.sub, name: friendAccepted.name }

const meta = {
  title: 'Molecules/GiftDialog',
  component: GiftDialog,
  args: { model: buildGiftDialogModel({
    open: true, recipient, memes: [giftablePaper, giftableSilver], query: '', pick: null, shares: 1,
    busy: false, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn(),
  }) },
} satisfies Meta<typeof GiftDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {}
export const EmptyBinder: Story = { args: { model: buildGiftDialogModel({ open: true, recipient, memes: [], query: '', pick: null, shares: 1, busy: false, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }) } }
export const Filtered: Story = { args: { model: buildGiftDialogModel({ open: true, recipient, memes: [giftablePaper, giftableSilver], query: 'silver', pick: null, shares: 1, busy: false, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }) } }
export const Picked: Story = { args: { model: buildGiftDialogModel({ open: true, recipient, memes: [giftablePaper, giftableSilver], query: '', pick: giftablePaper, shares: 3, busy: false, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }) } }
export const Busy: Story = { args: { model: buildGiftDialogModel({ open: true, recipient, memes: [giftablePaper, giftableSilver], query: '', pick: giftablePaper, shares: 3, busy: true, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }) } }
export const Error: Story = {
  args: { model: buildGiftDialogModel({ open: true, recipient, memes: [giftablePaper, giftableSilver], query: '', pick: giftablePaper, shares: 3, busy: false, error: 'not enough shares', onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }) },
}
export const Closed: Story = { args: { model: buildGiftDialogModel({ open: false, recipient, memes: [], query: '', pick: null, shares: 1, busy: false, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }) } }
