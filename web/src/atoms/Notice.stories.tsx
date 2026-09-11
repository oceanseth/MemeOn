import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Notice } from './Notice'
import { Spinner } from './Spinner'

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
export const Warning: Story = { args: { tone: 'warning', children: 'This one is final.' } }

/** Every tone stacked, which is what the dark twin shoots. */
export const Tones: Story = {
  args: { tone: 'info' },
  render: () => (
    <div style={{ display: 'grid', justifyItems: 'start', gap: 4, padding: 16 }}>
      <Notice tone="ok">🎉 Minted — it is in your binder.</Notice>
      <Notice tone="info">🧠 Braincells are play money.</Notice>
      <Notice tone="warning">⚠️ Trades are final.</Notice>
      <Notice tone="error">Could not save.</Notice>
      <Notice tone="busy" role="none" className="inline-flex items-center gap-2">
        <Spinner />
        Working…
      </Notice>
    </div>
  ),
}

export const Dark: Story = { ...Tones, globals: { theme: 'dark' } }

/** A screen can quiet an error down to role="status" when it isn't the primary outcome. */
export const RoleOverride: Story = {
  args: { tone: 'error', role: 'status', children: 'Quiet error.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeInTheDocument()
  },
}
