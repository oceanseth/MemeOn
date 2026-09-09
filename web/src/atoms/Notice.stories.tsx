import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Notice } from './Notice'

const meta = {
  title: 'Atoms/Notice',
  component: Notice,
  args: { children: 'Saved.' },
} satisfies Meta<typeof Notice>

export default meta
type Story = StoryObj<typeof meta>

export const Ok: Story = {
  args: { tone: 'ok' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeInTheDocument()
  },
}

export const ErrorTone: Story = {
  args: { tone: 'error', children: 'Could not save.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}

export const Busy: Story = { args: { tone: 'busy', children: 'Working…' } }
export const Info: Story = { args: { tone: 'info', children: 'Heads up.' } }

/** A screen can quiet an error down to role="status" when it isn't the primary outcome. */
export const RoleOverride: Story = {
  args: { tone: 'error', role: 'status', children: 'Quiet error.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeInTheDocument()
  },
}
