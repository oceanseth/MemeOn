import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Notice } from '../atoms/Notice'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import type { DeveloperKeyRowModel, DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { DevelopersScreen } from './DevelopersScreen'

const handlers = {
  onLabelChange: fn(),
  onCreateSubmit: fn(),
  onCopyKey: fn(),
  onRetry: fn(),
  onRevoke: fn(),
  onRevokeCancel: fn(),
  onRevokeConfirm: fn(),
}

/** story-local so the fixtures match the shipped `mk_` key format and the documented 5-key cap */
const fixtureKeys = [
  { prefix: 'mk_3f9a2c', label: 'my-trading-bot', createdAt: '2026-09-08T00:00:00.000Z' },
  { prefix: 'mk_7b11de', label: 'my key', createdAt: '2026-08-21T00:00:00.000Z' },
  { prefix: 'mk_c40e58', label: 'a-very-long-integration-label-that-has-to-wrap', createdAt: '2026-07-02T00:00:00.000Z' },
  { prefix: 'mk_91ab07', label: 'discord-bot', createdAt: '2026-06-14T00:00:00.000Z' },
  { prefix: 'mk_dd2f60', label: 'laptop scratch', createdAt: '2026-05-30T00:00:00.000Z' },
]

const toRow = (key: (typeof fixtureKeys)[number]): DeveloperKeyRowModel => ({
  prefix: key.prefix,
  label: key.label,
  createdAt: key.createdAt,
  createdLabel: `created ${new Date(key.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`,
  revokeButtonProps: {
    onClick: handlers.onRevoke,
    'aria-label': `Revoke API key ${key.label}`,
  },
})

const keyRows = fixtureKeys.slice(0, 2).map(toRow)
const fullKeyRows = fixtureKeys.map(toRow)

const confirmDialog = buildConfirmDialogModel({
  open: false,
  title: 'Revoke this API key?',
  message: 'This key will stop working immediately.',
  danger: true,
  confirmLabel: 'Revoke it',
  onCancel: handlers.onRevokeCancel,
  onConfirm: handlers.onRevokeConfirm,
})

const revokeMessage = (extra?: string) => (
  <>
    <code>mk_3f9a2c…</code>
    {' (my-trading-bot) will stop working immediately. Anything using it breaks.'}
    {extra && <Notice tone="error">{extra}</Notice>}
  </>
)

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
  showLoadError: false,
  showOk: false,
  okMsg: null,
  emptyCopy: 'No keys yet — name one above and hit Create key.',
  emptyHint: 'You’ll see the full key exactly once, so paste it straight into your bot.',
  loadingLabel: 'Loading your API keys…',
  loadErrorMessage: 'Couldn’t reach the key list — your keys are still active.',
  keysHeading: 'Your keys',
  quotaLabel: null,
  quotaNote: null,
  createLabel: 'Create key',
  freshKeyHeading: 'Copy it now — shown once:',
  copyLabel: 'Copy key',
  copiedCaption: '✓ Copied',
  copyDone: false,
  labelInputProps: {
    value: '',
    onChange: handlers.onLabelChange,
    maxLength: 60,
    'aria-label': 'API key label',
  },
  createFormProps: { onSubmit: handlers.onCreateSubmit },
  createButtonProps: { disabled: false, 'aria-busy': false },
  copyButtonProps: {
    onClick: handlers.onCopyKey,
    disabled: true,
    'aria-busy': false,
  },
  retryButtonProps: { onClick: handlers.onRetry },
  freshKeyProps: { tabIndex: 0 },
  freshKeyRegionProps: { role: 'status', 'aria-live': 'polite' },
  statusRegionProps: { role: 'status', 'aria-live': 'polite' },
  loadingProps: { role: 'status', 'aria-live': 'polite' },
  errorNoticeProps: { role: 'alert' },
  loadErrorProps: { role: 'alert' },
  confirmDialog,
}

const ready = {
  phase: 'ready',
  keys: keyRows,
  quotaLabel: '2 of 5 keys',
  showSpinner: false,
  showKeys: true,
} satisfies Partial<DevelopersScreenModel>

/** 390×844: the destructive control has to stay inside the viewport. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
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
    quotaLabel: '0 of 5 keys',
    showSpinner: false,
    showEmpty: true,
  },
}

export const Ready: Story = {
  args: ready,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // one control, one tab stop: the skill.md action is a link, never a link wrapping a button
    await expect(canvas.getByRole('link', { name: '📜 API skill.md' })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: '📜 API skill.md' })).toBeNull()
    // the route's title is the page's one h1 (the wave-3 screens took the same step); sections are h3
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Developers')
    await expect(canvas.getByRole('button', { name: 'Create key' })).toBeEnabled()
  },
}

/** The row at the width most people arrive at: nothing may sit outside the viewport. */
export const ReadyPhone: Story = {
  ...phone,
  args: ready,
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.scrollingElement as HTMLElement
    await expect(root.scrollWidth).toBe(root.clientWidth)
    const revoke = within(canvasElement).getByRole('button', { name: 'Revoke API key my-trading-bot' })
    await expect(revoke.getBoundingClientRect().right).toBeLessThanOrEqual(root.clientWidth)
  },
}

export const LoadError: Story = {
  args: {
    phase: 'error',
    showSpinner: false,
    showLoadError: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent('your keys are still active')
    await expect(canvas.queryByText(args.emptyCopy)).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(handlers.onRetry).toHaveBeenCalled()
  },
}

export const Creating: Story = {
  args: {
    ...ready,
    createLabel: 'Creating…',
    createButtonProps: { disabled: true, 'aria-busy': true },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Creating…' })
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
  },
}

export const AtQuota: Story = {
  args: {
    phase: 'ready',
    keys: fullKeyRows,
    quotaLabel: '5 of 5 keys',
    quotaNote: 'Key limit reached — revoke one to make room.',
    createButtonProps: { disabled: true, 'aria-busy': false },
    showSpinner: false,
    showKeys: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Create key' })).toBeDisabled()
    await expect(canvas.getByText('Key limit reached — revoke one to make room.')).toBeInTheDocument()
    // quota is a caption beside the heading, not a badge inside it
    await expect(canvas.getByRole('heading', { name: 'Your keys' })).toBeInTheDocument()
    await expect(canvas.getByText('5 of 5 keys')).toBeInTheDocument()
  },
}

export const FreshKey: Story = {
  args: {
    ...ready,
    freshKey: 'mk_3f9a2c8b1d7e4a05c6f9b2d3e4a5b6c7',
    copyButtonProps: { ...empty.copyButtonProps, disabled: false },
    showFreshKey: true,
  },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Copy key' })
    await expect(button).toBeEnabled()
    await userEvent.click(button)
    await expect(args.copyButtonProps.onClick).toHaveBeenCalledOnce()
  },
}

export const Copied: Story = {
  args: {
    ...ready,
    freshKey: 'mk_3f9a2c8b1d7e4a05c6f9b2d3e4a5b6c7',
    copyButtonProps: { ...empty.copyButtonProps, disabled: false },
    showFreshKey: true,
    copyDone: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // label stays "Copy key"; success is the caption beside the button
    await expect(canvas.getByRole('button', { name: 'Copy key' })).toBeEnabled()
    await expect(canvas.getByText('✓ Copied')).toBeInTheDocument()
  },
}

/** The clipboard refused (insecure origin / denied permission): the key stays selectable. */
export const CopyFailed: Story = {
  args: {
    ...ready,
    freshKey: 'mk_3f9a2c8b1d7e4a05c6f9b2d3e4a5b6c7',
    copyButtonProps: { ...empty.copyButtonProps, disabled: false },
    showFreshKey: true,
    err: 'Couldn’t copy — select the key and copy it manually.',
    showErr: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('copy it manually')
    await expect(canvas.getByText(/^mk_3f9a2c8b/)).toHaveAttribute('tabindex', '0')
  },
}

export const Error: Story = {
  args: {
    ...ready,
    err: 'key quota reached',
    showErr: true,
  },
}

export const RevokeConfirmed: Story = {
  args: {
    ...ready,
    showOk: true,
    okMsg: 'Revoked my-trading-bot.',
    keys: [keyRows[1]!],
    quotaLabel: '1 of 5 keys',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Revoked my-trading-bot.')).toBeInTheDocument()
  },
}

export const Revoking: Story = {
  args: {
    ...ready,
    confirmDialog: buildConfirmDialogModel({
      open: true,
      title: 'Revoke this API key?',
      message: revokeMessage(),
      danger: true,
      confirmLabel: 'Revoke it',
      onCancel: handlers.onRevokeCancel,
      onConfirm: handlers.onRevokeConfirm,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(handlers.onRevokeCancel).toHaveBeenCalled()
  },
}

/** The DELETE is in flight: the commit control cannot fire twice and says so. */
export const RevokingBusy: Story = {
  args: {
    ...ready,
    confirmDialog: buildConfirmDialogModel({
      open: true,
      busy: true,
      title: 'Revoke this API key?',
      message: revokeMessage(),
      danger: true,
      confirmLabel: 'Revoke it',
      onCancel: handlers.onRevokeCancel,
      onConfirm: handlers.onRevokeConfirm,
    }),
  },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('alertdialog')
    await expect(within(dialog).getByRole('button', { name: /Working/ })).toHaveAttribute('aria-busy', 'true')
  },
}

/** The DELETE failed: the dialog stays open with the reason inside it, so retry is one click away. */
export const RevokeFailed: Story = {
  args: {
    ...ready,
    confirmDialog: buildConfirmDialogModel({
      open: true,
      title: 'Revoke this API key?',
      message: revokeMessage('Couldn’t revoke my-trading-bot — try again.'),
      danger: true,
      confirmLabel: 'Revoke it',
      onCancel: handlers.onRevokeCancel,
      onConfirm: handlers.onRevokeConfirm,
    }),
  },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('alertdialog')
    await expect(within(dialog).getByRole('alert')).toHaveTextContent('Couldn’t revoke my-trading-bot')
    await expect(within(dialog).getByRole('button', { name: 'Revoke it' })).toBeInTheDocument()
  },
}

export const Dark: Story = { ...Ready, name: 'Ready dark', globals: { theme: 'dark' } }

/** Alias of `ReadyPhone` under the name every other family's phone twin carries. */
export const Phone390: Story = { ...ReadyPhone, name: 'Ready phone 390' }

export const DarkPhone390: Story = {
  ...ReadyPhone,
  name: 'Ready dark phone 390',
  globals: { ...phone.globals, theme: 'dark' },
}

/** The one-time secret on the phone, dark: the key wraps, the copy row stays inside the card. */
export const FreshKeyPhone390: Story = {
  ...FreshKey,
  name: 'Fresh key phone 390',
  ...phone,
  play: undefined,
}
