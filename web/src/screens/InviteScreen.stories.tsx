import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { inviteLou, invitePal } from '../../.storybook/fixtures'
import type { InviteScreenModel } from '../hooks/useInviteScreen'
import { InviteScreen } from './InviteScreen'

const handlers = {
  onAccept: fn(),
} satisfies Partial<InviteScreenModel>

const empty: InviteScreenModel = {
  phase: 'loading',
  data: null,
  err: null,
  busy: false,
  isSelf: false,
  showFatalError: false,
  showSpinner: true,
  showAcceptError: false,
  showHighlights: false,
  acceptLabel: '🎭 Accept invite — join with Masky',
  ...handlers,
}

const meta = {
  title: 'Screens/InviteScreen',
  component: InviteScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof InviteScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}

export const Error: Story = {
  args: {
    phase: 'error',
    err: 'This invite link is invalid or expired.',
    showFatalError: true,
    showSpinner: false,
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    data: invitePal,
    showSpinner: false,
    showHighlights: true,
  },
}

export const LoggedIn: Story = {
  args: {
    phase: 'ready',
    data: invitePal,
    showSpinner: false,
    showHighlights: true,
    acceptLabel: '🤝 Accept & befriend pal',
  },
}

export const Self: Story = {
  args: {
    phase: 'ready',
    data: inviteLou,
    isSelf: true,
    showSpinner: false,
    showHighlights: true,
  },
}

export const Accepting: Story = {
  args: {
    phase: 'accepting',
    data: invitePal,
    busy: true,
    showSpinner: false,
    showHighlights: true,
    acceptLabel: 'Opening Masky…',
  },
}

export const AcceptError: Story = {
  args: {
    phase: 'ready',
    data: invitePal,
    err: 'something went wrong',
    showSpinner: false,
    showAcceptError: true,
    showHighlights: true,
  },
}
