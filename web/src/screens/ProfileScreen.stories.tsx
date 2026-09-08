import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper, meLou, paperMeme } from '../../.storybook/fixtures'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'
import { ProfileScreen } from './ProfileScreen'

const palProfile = {
  sub: friendAccepted.sub,
  name: friendAccepted.name,
  picture: friendAccepted.picture,
  followers: 4,
  collectionSize: friendAccepted.collectionSize,
  portfolioValue: friendAccepted.portfolioValue,
}

const louProfile = {
  sub: meLou.sub,
  name: meLou.name,
  picture: meLou.picture,
  followers: 2,
  collectionSize: meLou.collectionSize,
  portfolioValue: meLou.portfolioValue,
}

const handlers = {
  onTabChange: fn(),
  onToggleFollow: fn(),
  onFriendAction: fn(),
} satisfies Partial<ProfileScreenModel>

const emptyCreated: ProfileScreenModel = {
  tab: 'created',
  err: null,
  showErr: false,
  showLoading: false,
  profile: palProfile,
  followingByMe: false,
  friendStatus: null,
  isSelf: false,
  showActions: true,
  showJoin: false,
  followPrimary: true,
  followLabel: '☆ Follow',
  friendLabel: '👋 Add friend',
  friendDisabled: false,
  createdCount: 0,
  binderCount: 0,
  memes: [],
  showEmpty: true,
  showGrid: false,
  ...handlers,
}

const meta = {
  title: 'Screens/ProfileScreen',
  component: ProfileScreen,
  args: emptyCreated,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof ProfileScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { showLoading: true, profile: null, showActions: false, showEmpty: false },
}

export const Error: Story = {
  args: {
    showErr: true,
    err: 'profile not found',
    profile: null,
    showActions: false,
    showEmpty: false,
  },
}

export const Created: Story = {
  args: {
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    memes: [paperMeme],
  },
}

export const BinderTab: Story = {
  args: {
    tab: 'binder',
    showEmpty: false,
    showGrid: true,
    binderCount: 1,
    memes: [{ ...giftablePaper, shares: 12 }],
  },
}

export const Self: Story = {
  args: {
    profile: louProfile,
    isSelf: true,
    showActions: false,
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    memes: [paperMeme],
  },
}

export const LoggedOut: Story = {
  args: {
    showActions: false,
    showJoin: true,
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    memes: [paperMeme],
  },
}

export const Following: Story = {
  args: {
    followingByMe: true,
    followPrimary: false,
    followLabel: '★ Following',
    friendStatus: 'accepted',
    friendLabel: '🤝 Friends',
    friendDisabled: true,
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    memes: [paperMeme],
  },
}

export const IncomingRequest: Story = {
  args: {
    friendStatus: 'incoming',
    friendLabel: '✅ Accept request',
    friendDisabled: false,
  },
}
