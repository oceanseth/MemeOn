import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { discordLinkCopy as copy } from '../copy/discordLink'
import type { DiscordLinkScreenModel } from '../hooks/useDiscordLinkScreen'
import { DiscordLinkScreen } from './DiscordLinkScreen'

const empty: DiscordLinkScreenModel = {
  phase: 'confirm',
  heading: copy.heading,
  documentTitle: copy.documentTitle,
  showConfirm: true,
  showBusy: false,
  showDone: false,
  showError: false,
  busyMessage: null,
  errTitle: null,
  errBody: null,
  canRetry: false,
  connectLabel: copy.connect,
  notNowLabel: copy.notNow,
  nextHeading: copy.nextHeading,
  command: copy.command,
  privacyLead: copy.privacy.lead,
  privacyRest: copy.privacy.rest,
  successLead: copy.success.lead,
  successRest: copy.success.rest,
  retryLabel: copy.retry,
  homeLabel: copy.home,
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

export const Confirm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: copy.heading })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: copy.connect })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: copy.notNow })).toBeInTheDocument()
  },
}

export const Redirecting: Story = {
  args: {
    phase: 'redirecting',
    showConfirm: false,
    showBusy: true,
    busyMessage: copy.busy.redirecting,
  },
}

export const Working: Story = {
  args: {
    phase: 'working',
    showConfirm: false,
    showBusy: true,
    busyMessage: copy.busy.working,
  },
  play: async ({ canvasElement }) => {
    // the waiting row is a muted Item with the 24px ring, not a restyled Spinner in a hand-made well
    const row = canvasElement.querySelector('[data-slot="item"]')!
    await expect(row).toHaveAttribute('data-variant', 'muted')
    await expect(row.querySelector('[data-slot="spinner"]')).toHaveAttribute('data-size', 'md')
    await expect(row.querySelector('[data-slot="item-title"]')).toHaveTextContent(copy.busy.working)
  },
}

export const Done: Story = {
  args: {
    phase: 'done',
    heading: copy.done,
    showConfirm: false,
    showDone: true,
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('[data-slot="alert"]')!
    await expect(alert).toHaveAttribute('data-variant', 'success')
    // the row's own action is 40 tall and lives in the alert's action row
    const action = alert.querySelector('[data-slot="alert-action"] a')!
    await expect(action).toHaveAttribute('href', '/discord')
    await expect(action.clientHeight).toBe(40)
  },
}

export const ErrorRetryable: Story = {
  args: {
    phase: 'error',
    heading: null,
    showConfirm: false,
    showError: true,
    errTitle: copy.error.title,
    errBody: copy.error.body.unreachable,
    canRetry: true,
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('[data-slot="alert"]')!
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert.querySelectorAll('[data-slot="alert-action"] > *')).toHaveLength(2)
  },
}

export const ErrorNoToken: Story = {
  args: {
    phase: 'error',
    heading: null,
    showConfirm: false,
    showError: true,
    errTitle: copy.error.title,
    errBody: copy.error.body['missing-token'],
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
