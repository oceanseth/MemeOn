import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cta = canvas.getByRole('link', { name: '🧠 Add MemeOn to Discord' })
    await expect(cta).toHaveAttribute('href', discordInstallUrl)
    // new-tab warning is visible copy, not screen-reader-only
    await expect(cta).toHaveAttribute('aria-describedby', 'discord-cta-note')
    await expect(canvas.getByText('opens Discord in a new tab')).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('MemeOn for Discord')
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

export const Dark: Story = { ...Ready, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Ready, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Ready,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const NotConfiguredDark: Story = {
  ...NotConfigured,
  name: 'Not configured dark',
  globals: { theme: 'dark' },
}
