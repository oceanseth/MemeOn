import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'
import { DiscordLinkScreen } from './DiscordLinkScreen'

const empty: DiscordLinkScreenModel = {
  phase: 'confirm',
  heading: 'Connect Discord to MemeOn',
  showConfirm: true,
  showBusy: false,
  showDone: false,
  showError: false,
  busyMessage: null,
  errTitle: null,
  errBody: null,
  canRetry: false,
  onConfirm: () => {},
  onRetry: () => {},
}

/** Storybook's viewport global; the vitest storybook project renders at the story's own width. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/DiscordLinkScreen',
  component: DiscordLinkScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof DiscordLinkScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Confirm: Story = {}

export const Redirecting: Story = {
  args: {
    phase: 'redirecting',
    showConfirm: false,
    showBusy: true,
    busyMessage: 'Taking you to Masky to log in…',
  },
}

export const Working: Story = {
  args: {
    phase: 'working',
    showConfirm: false,
    showBusy: true,
    busyMessage: 'Connecting your Discord…',
  },
}

export const Done: Story = {
  args: {
    phase: 'done',
    heading: '🎮 Connected!',
    showConfirm: false,
    showDone: true,
  },
}

export const ErrorRetryable: Story = {
  args: {
    phase: 'error',
    heading: null,
    showConfirm: false,
    showError: true,
    errTitle: "Couldn't connect Discord",
    errBody: "MemeOn couldn't reach the linker. Try again in a moment.",
    canRetry: true,
  },
}

export const ErrorNoToken: Story = {
  args: {
    phase: 'error',
    heading: null,
    showConfirm: false,
    showError: true,
    errTitle: "Couldn't connect Discord",
    errBody: 'This link is missing its code. Run /memeon-connect in Discord for a fresh one.',
    canRetry: false,
  },
}

export const Dark: Story = { ...Confirm, name: 'Confirm dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Confirm, name: 'Confirm phone 390', ...phone }

export const WorkingDark: Story = { ...Working, name: 'Working dark', globals: { theme: 'dark' } }

export const DoneDark: Story = { ...Done, name: 'Done dark', globals: { theme: 'dark' } }

export const DonePhone390: Story = { ...Done, name: 'Done phone 390', ...phone }

export const ErrorDark: Story = {
  ...ErrorRetryable,
  name: 'Error dark',
  globals: { theme: 'dark' },
}

export const ErrorPhone390: Story = { ...ErrorRetryable, name: 'Error phone 390', ...phone }
