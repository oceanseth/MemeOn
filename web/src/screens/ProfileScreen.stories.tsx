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

/** story-local: the fixtures carry no picture, so the image branch needs its own avatar */
const AVATAR_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#7fd4ff"/><text x="48" y="62" font-size="44" text-anchor="middle" fill="#0b0e14">🎭</text></svg>',
  )

const statsFor = (profile: typeof palProfile) => [
  { id: 'followers', glyph: '⭐', text: `${profile.followers} followers` },
  { id: 'collection', glyph: '📚', text: `${profile.collectionSize} in collection` },
  { id: 'portfolio', glyph: '🧠', text: `portfolio ${profile.portfolioValue.toLocaleString()}` },
]

const handlers = {
  createdTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
  binderTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
  followButtonProps: { 'aria-pressed': false, 'aria-busy': false, disabled: false, onClick: fn() },
  friendButtonProps: { 'aria-busy': false, disabled: false, onClick: fn() },
  retryButtonProps: { onClick: fn() },
} satisfies Partial<ProfileScreenModel>

const emptyCreated: ProfileScreenModel = {
  showErr: false,
  errTitle: "Couldn't load this profile.",
  errBody: 'Check your connection and try again.',
  retryLabel: 'Retry',
  errorLinkLabel: 'Browse the marketplace',
  errorLinkProps: { to: '/marketplace' },
  showLoading: false,
  loadingLabel: 'Loading profile',
  profile: {
    name: palProfile.name,
    avatar: { kind: 'initial', initial: 'P' },
    stats: statsFor(palProfile),
  },
  showActions: true,
  followButtonClassName: 'primary',
  followGlyph: '☆',
  followText: 'Follow',
  showFriendButton: true,
  friendGlyph: '👋',
  friendText: 'Add friend',
  showFriendChip: false,
  friendChipGlyph: '🤝',
  friendChipText: 'Friends',
  showActionErr: false,
  actionErr: '',
  showJoin: false,
  joinLabel: "Join MemeOn to collect pal's cards",
  joinLinkProps: { to: '/', state: { next: '/u/user-pal' } },
  createdCount: 0,
  binderCount: 0,
  cards: [],
  showEmpty: true,
  emptyTitle: "pal hasn't minted anything yet.",
  emptyBody: 'New cards land here the moment they mint one.',
  showEmptyLink: false,
  emptyLinkLabel: '',
  emptyLinkProps: { to: '/marketplace' },
  showGrid: false,
  createdTabClassName: 'primary',
  binderTabClassName: '',
  gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Created memes, 0 cards' },
  ...handlers,
}

const oneCreatedCard = {
  showEmpty: false,
  showGrid: true,
  createdCount: 1,
  gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Created memes, 1 card' },
  cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
} satisfies Partial<ProfileScreenModel>

const meta = {
  title: 'Screens/ProfileScreen',
  component: ProfileScreen,
  args: emptyCreated,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof ProfileScreen>

export default meta
type Story = StoryObj<typeof meta>

/** hero + grid skeleton behind one announced "Loading profile" */
export const Loading: Story = {
  args: { showLoading: true, profile: null, showActions: false, showEmpty: false },
}

/** transport failure: retry stays on the profile, the link is the way out */
export const LoadError: Story = {
  args: { showErr: true, profile: null, showActions: false, showEmpty: false },
}

/** 404: the link itself is dead, so retry is not the story — the marketplace is */
export const NotFound: Story = {
  args: {
    showErr: true,
    errTitle: "No one's minted under this link.",
    errBody: 'This profile may have been deleted.',
    profile: null,
    showActions: false,
    showEmpty: false,
  },
}

export const Created: Story = { args: oneCreatedCard }

export const WithAvatar: Story = {
  args: {
    ...oneCreatedCard,
    profile: {
      name: palProfile.name,
      avatar: {
        kind: 'image',
        imageProps: { src: AVATAR_SRC, alt: '', width: 96, height: 96, loading: 'lazy' },
      },
      stats: statsFor(palProfile),
    },
  },
}

export const BinderTab: Story = {
  args: {
    createdTabClassName: '',
    binderTabClassName: 'primary',
    createdTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
    showEmpty: false,
    showGrid: true,
    binderCount: 1,
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Binder memes, 1 card' },
    cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: '12/100 shares' }],
  },
}

export const Self: Story = {
  args: {
    ...oneCreatedCard,
    profile: {
      name: louProfile.name,
      avatar: { kind: 'initial', initial: 'L' },
      stats: statsFor(louProfile),
    },
    showActions: false,
  },
}

/** own empty binder: the marketplace is the next move */
export const SelfEmptyBinder: Story = {
  args: {
    profile: {
      name: louProfile.name,
      avatar: { kind: 'initial', initial: 'L' },
      stats: statsFor(louProfile),
    },
    showActions: false,
    createdTabClassName: '',
    binderTabClassName: 'primary',
    createdTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
    emptyTitle: "You don't hold shares in any memes yet.",
    emptyBody: "Buy into someone else's card and your shares show up here.",
    showEmptyLink: true,
    emptyLinkLabel: 'Browse the marketplace',
    emptyLinkProps: { to: '/marketplace' },
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Binder memes, 0 cards' },
  },
}

/** own empty created tab: mint is the next move */
export const SelfEmptyCreated: Story = {
  args: {
    profile: {
      name: louProfile.name,
      avatar: { kind: 'initial', initial: 'L' },
      stats: statsFor(louProfile),
    },
    showActions: false,
    emptyTitle: "You haven't minted anything yet.",
    emptyBody: 'Every meme you mint lands here as a 100-share card.',
    showEmptyLink: true,
    emptyLinkLabel: 'Mint your first meme',
    emptyLinkProps: { to: '/binder/new' },
  },
}

/** someone else's empty binder tab */
export const EmptyBinder: Story = {
  args: {
    createdTabClassName: '',
    binderTabClassName: 'primary',
    createdTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
    emptyTitle: "pal doesn't hold shares in any memes yet.",
    emptyBody: 'Shares they buy, win or get gifted show up here.',
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Binder memes, 0 cards' },
  },
}

/** one link, no nested button, and the return path rides in link state */
export const LoggedOutVisitor: Story = {
  args: { ...oneCreatedCard, showActions: false, showJoin: true },
}

export const Following: Story = {
  args: {
    ...oneCreatedCard,
    followButtonClassName: '',
    followGlyph: '★',
    followText: 'Following',
    followButtonProps: { 'aria-pressed': true, 'aria-busy': false, disabled: false, onClick: fn() },
    showFriendButton: false,
    showFriendChip: true,
  },
}

/** an outgoing request is a chip, not a dead button — and it says which way it points */
export const RequestSent: Story = {
  args: {
    ...oneCreatedCard,
    showFriendButton: false,
    showFriendChip: true,
    friendChipGlyph: '⏳',
    friendChipText: 'Request sent',
  },
}

export const IncomingRequest: Story = {
  args: { friendGlyph: '✅', friendText: 'Accept request' },
}

/** in flight: both controls are inert and say what they are doing */
export const Busy: Story = {
  args: {
    ...oneCreatedCard,
    followText: 'Following…',
    followButtonProps: { 'aria-pressed': false, 'aria-busy': true, disabled: true, onClick: fn() },
    friendText: 'Sending…',
    friendButtonProps: { 'aria-busy': true, disabled: true, onClick: fn() },
  },
}

export const ActionFailed: Story = {
  args: { ...oneCreatedCard, showActionErr: true, actionErr: "Couldn't update — try again." },
}

/** a display name with no spaces still shares the 390px hero with a 96px avatar */
export const LongName: Story = {
  args: {
    ...oneCreatedCard,
    profile: {
      name: 'xX_supermegabraincellcollector_Xx',
      avatar: { kind: 'initial', initial: 'X' },
      stats: statsFor(palProfile),
    },
  },
}
