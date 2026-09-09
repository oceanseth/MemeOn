import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { developerKeys } from '../../.storybook/fixtures'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import type { DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { DevelopersScreen } from './DevelopersScreen'

const handlers = {
  onLabelChange: fn(),
  onCreate: fn(),
  onCopyKey: fn(),
  onRevoke: fn(),
  onRevokeCancel: fn(),
  onRevokeConfirm: fn(),
}

const keyRows = developerKeys.map((key) => ({
  prefix: key.prefix,
  label: key.label,
  createdLabel: new Date(key.createdAt).toLocaleDateString(),
  revokeButtonProps: {
    onClick: handlers.onRevoke,
    'aria-label': `Revoke API key ${key.label}`,
  },
}))

const confirmDialog = buildConfirmDialogModel({
  open: false,
  title: 'Revoke this API key?',
  message: 'This key will stop working immediately.',
  danger: true,
  confirmLabel: 'Revoke it',
  onCancel: handlers.onRevokeCancel,
  onConfirm: handlers.onRevokeConfirm,
})

const empty: DevelopersScreenModel = {
  phase: 'loading',
  keys: null,
  freshKey: null,
  err: null,
  showSpinner: true,
  showEmpty: false,
  showKeys: false,
  showErr: false,
  showFreshKey: false,
  copyLabel: 'Copy key',
  labelInputProps: {
    value: '',
    onChange: handlers.onLabelChange,
    maxLength: 60,
    'aria-label': 'API key label',
  },
  createButtonProps: {
    onClick: handlers.onCreate,
    disabled: false,
    'aria-busy': false,
    'aria-label': 'Generate API key',
  },
  copyButtonProps: {
    onClick: handlers.onCopyKey,
    disabled: true,
    'aria-busy': false,
    'aria-label': 'Copy API key',
  },
  errorNoticeProps: { role: 'alert' },
  confirmDialog,
}

const meta = {
  title: 'Screens/DevelopersScreen',
  component: DevelopersScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof DevelopersScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}

export const Empty: Story = {
  args: {
    phase: 'empty',
    keys: [],
    showSpinner: false,
    showEmpty: true,
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    keys: keyRows,
    showSpinner: false,
    showKeys: true,
  },
}

export const FreshKey: Story = {
  args: {
    phase: 'ready',
    keys: keyRows,
    freshKey: 'mo_live_abcdefghijklmnopqrstuvwxyz',
    copyButtonProps: { ...empty.copyButtonProps, disabled: false },
    showSpinner: false,
    showKeys: true,
    showFreshKey: true,
  },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Copy API key' })
    await expect(button).toBeEnabled()
    await expect(button).toHaveTextContent('Copy key')
    await userEvent.click(button)
    await expect(args.copyButtonProps.onClick).toHaveBeenCalledOnce()
  },
}

export const Copied: Story = {
  args: {
    phase: 'ready',
    keys: keyRows,
    freshKey: 'mo_live_abcdefghijklmnopqrstuvwxyz',
    copyButtonProps: { ...empty.copyButtonProps, disabled: false },
    showSpinner: false,
    showKeys: true,
    showFreshKey: true,
    copyLabel: 'Copied ✓',
  },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Copy API key' })
    await expect(button).toBeEnabled()
    await expect(button).toHaveTextContent('Copied ✓')
    await userEvent.click(button)
    await expect(args.copyButtonProps.onClick).toHaveBeenCalledOnce()
  },
}

export const Error: Story = {
  args: {
    phase: 'error',
    keys: keyRows,
    err: 'key creation failed',
    showSpinner: false,
    showKeys: true,
    showErr: true,
  },
}

export const Revoking: Story = {
  args: {
    phase: 'ready',
    keys: keyRows,
    showSpinner: false,
    showKeys: true,
    confirmDialog: buildConfirmDialogModel({
      open: true,
      title: 'Revoke this API key?',
      message: 'This key will stop working immediately.',
      danger: true,
      confirmLabel: 'Revoke it',
      onCancel: handlers.onRevokeCancel,
      onConfirm: handlers.onRevokeConfirm,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(handlers.onRevokeCancel).toHaveBeenCalledOnce()
  },
}
