import type { Meta, StoryObj } from '@storybook/react-vite'
import { GiftDialog } from './GiftDialog'
import { BINDER } from './fixtures'

const meta = {
  title: 'Overlays/GiftDialog',
  component: GiftDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Gift shares from your binder to a friend: search → pick → choose amount. The host supplies the giftable memes and performs the transfer.',
      },
    },
  },
} satisfies Meta<typeof GiftDialog>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}
const base = {
  open: true,
  recipient: { sub: 'u_2', name: 'oxferd' },
  onClose: noop,
  onGift: noop,
}

/** The picker with a few holdings to choose from. */
export const Default: Story = {
  args: { ...base, memes: BINDER },
}

/** Nothing giftable — the sender holds no shares. */
export const EmptyBinder: Story = {
  args: { ...base, memes: [] },
}

/** Mid-transfer: the confirm button reports its in-flight state. */
export const Sending: Story = {
  args: { ...base, memes: BINDER, busy: true },
}

/** A failed transfer surfaces the error inline. */
export const Failed: Story = {
  args: { ...base, memes: BINDER, error: 'you no longer hold enough shares' },
}

/** Closed renders nothing. */
export const Closed: Story = {
  args: { ...base, open: false, memes: BINDER },
}
