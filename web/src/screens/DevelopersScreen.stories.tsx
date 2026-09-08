import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { developerKeys } from '../../.storybook/fixtures'
import type { DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { DevelopersScreen } from './DevelopersScreen'

const handlers = {
  onLabelChange: fn(),
  onCreate: fn(),
  onCopyKey: fn(),
  onRevoke: fn(),
  onRevokeCancel: fn(),
  onRevokeConfirm: fn(),
} satisfies Partial<DevelopersScreenModel>

const empty: DevelopersScreenModel = {
  phase: 'loading',
  keys: null,
  label: '',
  freshKey: null,
  revoking: null,
  err: null,
  copied: false,
  showSpinner: true,
  showEmpty: false,
  showKeys: false,
  showErr: false,
  showFreshKey: false,
  showRevoke: false,
  copyLabel: 'Copy key',
  ...handlers,
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
    keys: developerKeys,
    showSpinner: false,
    showKeys: true,
  },
}

export const FreshKey: Story = {
  args: {
    phase: 'ready',
    keys: developerKeys,
    freshKey: 'mo_live_abcdefghijklmnopqrstuvwxyz',
    showSpinner: false,
    showKeys: true,
    showFreshKey: true,
  },
}

export const Copied: Story = {
  args: {
    phase: 'ready',
    keys: developerKeys,
    freshKey: 'mo_live_abcdefghijklmnopqrstuvwxyz',
    copied: true,
    showSpinner: false,
    showKeys: true,
    showFreshKey: true,
    copyLabel: 'Copied ✓',
  },
}

export const Error: Story = {
  args: {
    phase: 'error',
    keys: developerKeys,
    err: 'key creation failed',
    showSpinner: false,
    showKeys: true,
    showErr: true,
  },
}

export const Revoking: Story = {
  args: {
    phase: 'ready',
    keys: developerKeys,
    revoking: developerKeys[0],
    showSpinner: false,
    showKeys: true,
    showRevoke: true,
  },
}
