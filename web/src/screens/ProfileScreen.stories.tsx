import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper, meLou, paperMeme } from '../../.storybook/fixtures'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
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
  createdTabButtonProps: { 'aria-pressed': true, onClick: fn() },
  binderTabButtonProps: { 'aria-pressed': false, onClick: fn() },
  followButtonProps: { 'aria-pressed': false, onClick: fn() },
  friendButtonProps: { onClick: fn(), disabled: false },
} satisfies Partial<ProfileScreenModel>

const emptyCreated: ProfileScreenModel = {
  err: null,
  showErr: false,
  showLoading: false,
  profile: {
    name: palProfile.name,
    hasPicture: !!palProfile.picture,
    imageProps: { src: palProfile.picture ?? '', alt: palProfile.name },
    statsLabel: `⭐ ${palProfile.followers} followers · 📚 ${palProfile.collectionSize} memes · portfolio 🧠 ${palProfile.portfolioValue.toLocaleString()}`,
  },
  showActions: true,
  showJoin: false,
  followButtonClassName: 'primary',
  followLabel: '☆ Follow',
  friendLabel: '👋 Add friend',
  createdCount: 0,
  binderCount: 0,
  cards: [],
  showEmpty: true,
  showGrid: false,
  createdTabClassName: 'primary',
  binderTabClassName: '',
  joinLinkProps: { to: '/' },
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
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
  },
}

export const BinderTab: Story = {
  args: {
    createdTabClassName: '',
    binderTabClassName: 'primary',
    createdTabButtonProps: { 'aria-pressed': false, onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, onClick: fn() },
    showEmpty: false,
    showGrid: true,
    binderCount: 1,
    cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: '12/100 shares' }],
  },
}

export const Self: Story = {
  args: {
    profile: {
      name: louProfile.name,
      hasPicture: !!louProfile.picture,
      imageProps: { src: louProfile.picture ?? '', alt: louProfile.name },
      statsLabel: `⭐ ${louProfile.followers} followers · 📚 ${louProfile.collectionSize} memes · portfolio 🧠 ${louProfile.portfolioValue.toLocaleString()}`,
    },
    showActions: false,
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
  },
}

export const LoggedOut: Story = {
  args: {
    showActions: false,
    showJoin: true,
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
  },
}

export const Following: Story = {
  args: {
    followButtonClassName: '',
    followLabel: '★ Following',
    friendLabel: '🤝 Friends',
    followButtonProps: { 'aria-pressed': true, onClick: fn() },
    friendButtonProps: { onClick: fn(), disabled: true },
    showEmpty: false,
    showGrid: true,
    createdCount: 1,
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
  },
}

export const IncomingRequest: Story = {
  args: {
    friendLabel: '✅ Accept request',
    friendButtonProps: { onClick: fn(), disabled: false },
  },
}
