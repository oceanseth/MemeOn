import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { readSale, unreadFriend, unreadSale } from '../../.storybook/fixtures'
import { AlertsBell } from './AlertsBell'

const meta = {
  title: 'Molecules/AlertsBell',
  component: AlertsBell,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 24, minHeight: 220 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    alerts: [unreadSale, unreadFriend, readSale],
    open: false,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof AlertsBell>

export default meta
type Story = StoryObj<typeof meta>

export const ClosedUnread: Story = {}
export const OpenUnread: Story = { args: { open: true } }
export const AllRead: Story = { args: { open: true, alerts: [readSale] } }
export const Empty: Story = { args: { open: true, alerts: [] } }
