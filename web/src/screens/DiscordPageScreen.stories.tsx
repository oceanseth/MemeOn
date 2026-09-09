import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { discordInstallUrl } from '../../.storybook/fixtures'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'
import { DiscordPageScreen } from './DiscordPageScreen'

const pendingSteps = 'The button above goes live the moment the app is registered.'

const empty: DiscordPageScreenModel = {
  phase: 'loading',
  showLoading: true,
  showInstall: false,
  showPending: false,
  showError: false,
  installSteps: pendingSteps,
  installLinkProps: {
    href: undefined,
    target: '_blank',
    rel: 'noreferrer',
  },
}

const meta = {
  title: 'Screens/DiscordPageScreen',
  component: DiscordPageScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof DiscordPageScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}

export const Ready: Story = {
  args: {
    phase: 'ready',
    showLoading: false,
    showInstall: true,
    showPending: false,
    installSteps: 'Hit the button above.',
    installLinkProps: {
      href: discordInstallUrl,
      target: '_blank',
      rel: 'noreferrer',
    },
  },
}

export const NotConfigured: Story = {
  args: {
    phase: 'ready',
    showLoading: false,
    showInstall: false,
    showPending: true,
  },
}

export const Errored: Story = {
  args: {
    phase: 'errored',
    showLoading: false,
    showError: true,
  },
}
