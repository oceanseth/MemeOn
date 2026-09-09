import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { discordInstallUrl } from '../../.storybook/fixtures'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'
import { DiscordPageScreen } from './DiscordPageScreen'

const empty: DiscordPageScreenModel = {
  phase: 'loading',
  showInstall: false,
  showPending: false,
  installLinkProps: {
    href: undefined,
    target: '_blank',
    rel: 'noreferrer',
    'aria-label': 'Add MemeOn to Discord (opens Discord in a new tab)',
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
    showInstall: true,
    showPending: false,
    installLinkProps: {
      href: discordInstallUrl,
      target: '_blank',
      rel: 'noreferrer',
      'aria-label': 'Add MemeOn to Discord (opens Discord in a new tab)',
    },
  },
}

export const NotConfigured: Story = {
  args: {
    phase: 'ready',
    showInstall: false,
    showPending: true,
  },
}
