import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { discordInstallUrl } from '../../.storybook/fixtures'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'
import { DiscordPageScreen } from './DiscordPageScreen'

const empty: DiscordPageScreenModel = {
  phase: 'loading',
  installUrl: null,
  loaded: false,
  showInstall: false,
  showPending: false,
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
    installUrl: discordInstallUrl,
    loaded: true,
    showInstall: true,
    showPending: false,
  },
}

export const NotConfigured: Story = {
  args: {
    phase: 'ready',
    installUrl: null,
    loaded: true,
    showInstall: false,
    showPending: true,
  },
}
