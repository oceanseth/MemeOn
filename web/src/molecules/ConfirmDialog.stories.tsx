import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Molecules/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: 'Delete forever?',
    message: "This can't be undone.",
    confirmLabel: 'Delete it',
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const Closed: Story = { args: { open: false } }
export const Danger: Story = { args: { danger: true } }
export const Busy: Story = { args: { busy: true } }
