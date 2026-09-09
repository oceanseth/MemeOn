import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { readSale, unreadFriend, unreadSale } from '../../.storybook/fixtures'
import { buildAlertsBellModel } from '../lib/alertsBellModel'
import { AlertsBell } from './AlertsBell'

const alerts = [unreadSale, unreadFriend, readSale]
const onOpenChange = fn()

/** A full inbox: the badge caps, the list caps, and the tail says so. */
const flood = Array.from({ length: 1284 }, (_, index) => ({
  ...unreadSale,
  id: `alert-flood-${index}`,
  message: `someone bought ${index + 1} shares`,
}))

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
  args: { model: buildAlertsBellModel({ alerts, open: false, onOpenChange }) },
} satisfies Meta<typeof AlertsBell>

export default meta
type Story = StoryObj<typeof meta>

export const ClosedUnread: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Alerts, 2 unread' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('aria-controls', 'alerts-pop')
    await expect(trigger).toHaveTextContent('2')
    await userEvent.click(trigger)
    await expect(onOpenChange).toHaveBeenCalledWith(true)
  },
}

export const OpenUnread: Story = {
  args: { model: buildAlertsBellModel({ alerts, open: true, onOpenChange }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Alerts, 2 unread' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('group', { name: 'Alerts' })).toBeInTheDocument()
    await userEvent.click(trigger)
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    onOpenChange.mockClear()

    // the row is the link, so its name carries the unread cue, the message and the timestamp
    const saleLink = canvas.getAllByText(unreadSale.message)[0]!.closest('a')!
    await expect(saleLink).toHaveClass('alert-row')
    await expect(saleLink).toHaveAttribute('href', `/m/${unreadSale.memeId}`)
    await expect(saleLink).toHaveAccessibleName(expect.stringContaining('Unread.'))
    await userEvent.click(saleLink)
    await expect(onOpenChange).toHaveBeenCalledWith(false)
    onOpenChange.mockClear()

    const friendLink = canvas.getByText(unreadFriend.message).closest('a')!
    await expect(friendLink).toHaveAttribute('href', `/u/${encodeURIComponent(unreadFriend.subjectSub!)}`)
    await userEvent.click(friendLink)
    await expect(onOpenChange).toHaveBeenCalledWith(false)
  },
}

/** Opened by keyboard, closed by keyboard: Escape dismisses and focus returns to the bell. */
export const OpenKeyboardDismiss: Story = {
  args: { model: buildAlertsBellModel({ alerts, open: true, onOpenChange }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onOpenChange.mockClear()
    const trigger = canvas.getByRole('button', { name: 'Alerts, 2 unread' })
    trigger.focus()
    await userEvent.keyboard('{Escape}')
    await expect(onOpenChange).toHaveBeenCalledWith(false)
    await expect(trigger).toHaveFocus()
  },
}

/** Reading the list must not erase what was new: the frozen ids keep their bar and dot. */
export const OpenUnreadStaysMarked: Story = {
  args: {
    model: buildAlertsBellModel({
      alerts: alerts.map((alert) => ({ ...alert, read: true })),
      open: true,
      onOpenChange,
      wasUnread: [unreadSale.id, unreadFriend.id],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Alerts' })).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll('.alert-row.unread')).toHaveLength(2)
    await expect(canvas.getAllByText('Unread.')).toHaveLength(2)
  },
}

export const ManyUnread: Story = {
  args: { model: buildAlertsBellModel({ alerts: flood, open: true, onOpenChange }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Alerts, 1284 unread' })).toHaveTextContent('99+')
    await expect(canvasElement.querySelectorAll('.alert-row')).toHaveLength(21)
    await expect(canvas.getByText('Showing your 20 most recent alerts.')).toBeInTheDocument()
  },
}

/** A dead API is a problem, not an empty inbox. */
export const AlertsOffline: Story = {
  args: { model: buildAlertsBellModel({ alerts: [], open: true, onOpenChange, failed: true }) },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("Alerts are offline — we'll retry in a moment."),
    ).toBeInTheDocument()
  },
}

export const AllRead: Story = {
  args: { model: buildAlertsBellModel({ alerts: [readSale], open: true, onOpenChange }) },
}
export const Empty: Story = {
  args: { model: buildAlertsBellModel({ alerts: [], open: true, onOpenChange }) },
}
