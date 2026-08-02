import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Overlays/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Confirmation modal over a full-viewport scrim. Render it always and control it with `open`.',
      },
    },
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}
const base = { open: true, onConfirm: noop, onCancel: noop }

/** The standard confirmation: title, message, cancel + primary confirm. */
export const Default: Story = {
  args: {
    ...base,
    title: 'Reshare this meme?',
    message: 'It goes out to your followers and starts earning reshare credit toward the next tier.',
    confirmLabel: 'Reshare it',
  },
}

/** `danger` adds the ⚠️ prefix, a red-tinted border, and a destructive confirm. */
export const Danger: Story = {
  args: {
    ...base,
    danger: true,
    title: 'Burn this meme forever?',
    message: 'All 100 shares are destroyed and holders are not refunded. This cannot be undone.',
    confirmLabel: 'Burn it',
  },
}

/** `busy` swaps the confirm label for “Working…” and disables both buttons. */
export const Busy: Story = {
  args: {
    ...base,
    busy: true,
    title: 'Buying 12 shares',
    message: 'Confirming the trade at 🧠96 per share.',
    confirmLabel: 'Buy shares',
  },
}

/** `message` takes any ReactNode, not just a string. */
export const RichMessage: Story = {
  args: {
    ...base,
    title: 'Accept this gift?',
    confirmLabel: 'Accept gift',
    cancelLabel: 'Not now',
    message: (
      <>
        <strong>grimace_enjoyer</strong> is sending you <strong>8 shares</strong> of{' '}
        <em>distracted boyfriend, but it is my side project</em>.
        <br />
        Gifts count toward your collection size right away.
      </>
    ),
  },
}

/** Closed is a real state — it renders nothing. */
export const Closed: Story = {
  args: { ...base, open: false, title: 'Nothing to see', message: 'This dialog is closed.' },
}
