import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { readSale, unreadFriend, unreadSale } from '../../.storybook/fixtures'
import { buildAlertsBellModel } from '../lib/alertsBellModel'
import { AlertsBell } from './AlertsBell'

const alerts = [unreadSale, unreadFriend, readSale]
const onOpenChange = fn()

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
    const trigger = canvas.getByRole('button', { name: 'Alerts' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveTextContent('2')
    await userEvent.click(trigger)
    await expect(onOpenChange).toHaveBeenCalledWith(true)
  },
}

export const OpenUnread: Story = {
  args: { model: buildAlertsBellModel({ alerts, open: true, onOpenChange }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Alerts' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(trigger)
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    onOpenChange.mockClear()

    const saleLink = canvas.getAllByRole('link', { name: unreadSale.message })[0]!
    await expect(saleLink).toHaveAttribute('href', `/m/${unreadSale.memeId}`)
    await userEvent.click(saleLink)
    await expect(onOpenChange).toHaveBeenCalledWith(false)
    onOpenChange.mockClear()

    const friendLink = canvas.getByRole('link', { name: unreadFriend.message })
    await expect(friendLink).toHaveAttribute('href', `/u/${encodeURIComponent(unreadFriend.subjectSub!)}`)
    await userEvent.click(friendLink)
    await expect(onOpenChange).toHaveBeenCalledWith(false)
  },
}

export const AllRead: Story = {
  args: { model: buildAlertsBellModel({ alerts: [readSale], open: true, onOpenChange }) },
}
export const Empty: Story = {
  args: { model: buildAlertsBellModel({ alerts: [], open: true, onOpenChange }) },
}
