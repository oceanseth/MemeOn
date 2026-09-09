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
