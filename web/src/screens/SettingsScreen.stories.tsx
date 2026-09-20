import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { meLou } from '../../.storybook/fixtures'
import { settingsCopy as copy } from '../copy/settings'
import { sharedCopy } from '../copy/shared'
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
      options: {
        phone390: {
          name: 'Phone 390',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/SettingsScreen',
  component: SettingsScreen,
  args: model,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SettingsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(copy.title)
    // the three cards Lou kept: Typography, Icon style, and Alerts are gone until their APIs exist
    await expect(canvas.getByRole('heading', { name: copy.account.heading })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: copy.appearance.heading })).toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { name: copy.connections.heading }),
    ).toBeInTheDocument()
    await expect(canvas.queryByRole('heading', { name: /Typography|Icon style/ })).toBeNull()
    // the one segmented well, bound to the theme store
    await expect(canvas.getByRole('group', { name: sharedCopy.theme.group })).toBeInTheDocument()
    // three Card sections, and every row is an Item
    await expect(canvasElement.querySelectorAll('[data-slot="card"]')).toHaveLength(3)
    await expect(canvasElement.querySelector('[data-slot="settings-account"]')).toHaveAttribute(
      'data-variant',
      'default',
    )
    // the name is an identity affordance: it wears no glyph, and never MemeOn's own brain
    await expect(
      canvasElement.querySelector('[data-slot="settings-account"] [data-slot="icon"]'),
    ).toBeNull()
    await expect(canvasElement.querySelectorAll('[data-slot="item-title"]').length).toBeGreaterThan(
      0,
    )
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
    await expect(
      canvas.getByRole('link', { name: copy.connections.discord.connect }),
    ).toHaveAttribute('href', '/discord')
    // the connection row is an `Item` rendered as the list item it always was
    const row = canvasElement.querySelector('[data-slot="connection-row"]')!
    await expect(row.tagName).toBe('LI')
    await expect(row).toHaveAttribute('data-linked', 'false')
    // the row draws whatever mark the model names, and for Discord that is the brand mark — the
    // same one the account menu's row wears, filled rather than stroked into the 1.5 family
    await expect(row.querySelector('[data-slot="item-title"] [data-slot="icon"]')).not.toBeNull()
  },
}

/** The shape the row takes the day the API reports a link; the screen needs no change. */
export const Linked: Story = {
  args: (() => {
    const discordRow = model.connections.rows[0]
    if (!discordRow) throw new Error('expected discord connection row')
    return {
      connections: {
        ...model.connections,
        rows: [
          {
            ...discordRow,
            stateLabel: copy.connections.discord.linkedAs('oxfern#4417'),
            linked: true,
            actionLabel: copy.connections.discord.open,
          },
        ],
      },
    }
  })(),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(copy.connections.discord.linkedAs('oxfern#4417')),
    ).toBeInTheDocument()
  },
}

export const Dark: Story = {
  ...Default,
  name: 'Default dark',
  globals: { theme: 'dark' },
}

export const Phone390: Story = {
  ...Default,
  name: 'Default phone 390',
  ...phone,
}

export const DarkPhone390: Story = {
  ...Default,
  name: 'Default dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
