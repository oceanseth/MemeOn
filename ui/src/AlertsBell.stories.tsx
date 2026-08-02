import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AlertsBell } from './AlertsBell'
import { ALERTS } from './fixtures'

const meta = {
  title: 'Chrome/AlertsBell',
  component: AlertsBell,
  parameters: {
    docs: {
      description: {
        component:
          'Alerts bell with unread badge and popover feed. Controlled — the host owns fetching and marking-as-read.',
      },
    },
  },
} satisfies Meta<typeof AlertsBell>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

/** Closed, with two unread alerts driving the badge count. */
export const WithUnread: Story = {
  args: { alerts: ALERTS, open: false, onToggle: noop, onDismiss: noop },
}

/** No badge when everything has been read. */
export const AllRead: Story = {
  args: {
    alerts: ALERTS.map((a) => ({ ...a, read: true })),
    open: false,
    onToggle: noop,
    onDismiss: noop,
  },
}

/** The open popover: unread rows are highlighted, each links to its subject. */
export const OpenFeed: Story = {
  args: { alerts: ALERTS, open: true, onToggle: noop, onDismiss: noop },
  decorators: [(S) => <div style={{ minHeight: 320 }}><S /></div>],
}

/** Empty state. */
export const NoAlerts: Story = {
  args: { alerts: [], open: true, onToggle: noop, onDismiss: noop },
  decorators: [(S) => <div style={{ minHeight: 160 }}><S /></div>],
}

/** Live: click the bell to open and close the feed. */
export const Interactive: Story = {
  args: { alerts: ALERTS, open: false, onToggle: noop, onDismiss: noop },
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ minHeight: 320 }}>
        <AlertsBell
          alerts={ALERTS}
          open={open}
          onToggle={() => setOpen((o) => !o)}
          onDismiss={() => setOpen(false)}
        />
      </div>
    )
  },
}
