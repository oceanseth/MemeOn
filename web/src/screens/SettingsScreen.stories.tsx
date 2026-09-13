import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { meLou } from '../../.storybook/fixtures'
import { settingsCopy as copy } from '../copy/settings'
import { buildSettingsScreenModel } from '../hooks/useSettingsScreen'
import { SettingsScreen } from './SettingsScreen'

const onLogout = fn()
const onThemeChange = fn()

const model = buildSettingsScreenModel({
  user: meLou,
  theme: { value: 'auto', onChange: onThemeChange },
  onLogout,
})

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
  title: 'Screens/SettingsScreen',
  component: SettingsScreen,
  args: model,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof SettingsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(copy.title)
    // the four cards Lou kept: Typography and Icon style are gone for good
    await expect(canvas.getByRole('heading', { name: copy.account.heading })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: copy.appearance.heading })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: copy.connections.heading })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: copy.alerts.heading })).toBeInTheDocument()
    await expect(canvas.queryByRole('heading', { name: /Typography|Icon style/ })).toBeNull()
    // the one segmented well, bound to the theme store
    await expect(canvas.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  },
}

/** The account row's only control logs out; nothing else on the card can fire. */
export const LogOut: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: copy.account.logOut }))
    await expect(onLogout).toHaveBeenCalled()
  },
}

/** No Discord field exists on `Me` yet, so the row states the one thing the app knows. */
export const NotLinked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.connections.discord.service)).toBeInTheDocument()
    await expect(canvas.getByText(copy.connections.discord.notLinked)).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: copy.connections.discord.connect })).toHaveAttribute('href', '/discord')
  },
}

/** The shape the row takes the day the API reports a link; the screen needs no change. */
export const Linked: Story = {
  args: {
    connections: {
      ...model.connections,
      rows: [
        {
          ...model.connections.rows[0],
          stateLabel: copy.connections.discord.linkedAs('oxfern#4417'),
          linked: true,
          actionLabel: copy.connections.discord.open,
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(copy.connections.discord.linkedAs('oxfern#4417'))).toBeInTheDocument()
  },
}

/** No endpoint stores alert preferences: the switches are inert and say so. */
export const AlertsComingSoon: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sales = canvas.getByRole('button', { name: copy.alerts.sales })
    await expect(sales).toBeDisabled()
    await expect(canvas.getByRole('button', { name: copy.alerts.tierUps })).toBeDisabled()
    await expect(canvas.getByText(copy.alerts.caption)).toBeInTheDocument()
    await expect(sales).toHaveAttribute('aria-describedby', 'settings-alerts-note')
  },
}

export const Dark: Story = { ...Default, name: 'Default dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Default, name: 'Default phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Default,
  name: 'Default dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
