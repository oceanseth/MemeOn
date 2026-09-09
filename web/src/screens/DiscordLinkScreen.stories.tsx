import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'
import { DiscordLinkScreen } from './DiscordLinkScreen'

const empty: DiscordLinkScreenModel = {
  phase: 'working',
  err: null,
  showWorking: true,
  showDone: false,
  showError: false,
}

const meta = {
  title: 'Screens/DiscordLinkScreen',
  component: DiscordLinkScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof DiscordLinkScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Working: Story = {}

export const Done: Story = {
  args: {
    phase: 'done',
    showWorking: false,
    showDone: true,
  },
}

export const Error: Story = {
  args: {
    phase: 'error',
    err: 'missing link token — run /memeon-connect in Discord again',
    showWorking: false,
    showError: true,
  },
}
