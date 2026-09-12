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
  { id: 'collection', glyph: '📚', text: `${profile.collectionSize} memes` },
  { id: 'portfolio', glyph: '🧠', text: `${profile.portfolioValue.toLocaleString()} held` },
  { id: 'followers', glyph: '⭐', text: `${profile.followers} followers` },
]

const handlers = {
  createdTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
  binderTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
  followButtonProps: { 'aria-pressed': false, 'aria-busy': false, disabled: false, onClick: fn() },
  friendButtonProps: { 'aria-busy': false, disabled: false, onClick: fn() },
  retryButtonProps: { onClick: fn() },
  shareButtonProps: { onClick: fn() },
  showMoreButtonProps: { onClick: fn() },
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
  title: palProfile.name,
  intro: null,
  identityLine: `Binder of ${palProfile.name}`,
  showBinderHero: false,
  tradeLabel: 'Trade',
  tradeLinkProps: { to: '/trade', 'aria-label': `Trade with ${palProfile.name}` },
  shareLabel: '🔗 Share binder',
  showSelfActions: false,
  settingsLabel: 'Settings',
  settingsLinkProps: { to: '/settings' },
  reshareNote: 'Every reshare of these links levels the cards up.',
  gridCountLabel: 'Showing 0 of 0',
  showMore: false,
  showMoreLabel: 'Show 12 more',
  profile: {
    name: palProfile.name,
    avatarSrc: null,
    stats: statsFor(palProfile),
  },
  showActions: true,
  followButtonVariant: 'default',
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
  joinLabel: 'Log in to start your own binder',
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
      avatarSrc: AVATAR_SRC,
      stats: statsFor(palProfile),
    },
  },
}

export const BinderTab: Story = {
  args: {
    createdTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
    showEmpty: false,
    showGrid: true,
    binderCount: 1,
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Binder memes, 1 card' },
    cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: 'holds 12/100' }],
  },
}

export const Self: Story = {
  args: {
    ...oneCreatedCard,
    title: louProfile.name,
    identityLine: `Binder of ${louProfile.name}`,
    profile: {
      name: louProfile.name,
      avatarSrc: null,
      stats: statsFor(louProfile),
    },
    showActions: false,
    showSelfActions: true,
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: '100/100 shares' }],
  },
}

/** own empty binder: the marketplace is the next move */
export const SelfEmptyBinder: Story = {
  args: {
    profile: {
      name: louProfile.name,
      avatarSrc: null,
      stats: statsFor(louProfile),
    },
    showActions: false,
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
      avatarSrc: null,
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
    createdTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
    emptyTitle: "pal doesn't hold shares in any memes yet.",
    emptyBody: 'Shares they buy, win or get gifted show up here.',
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Binder memes, 0 cards' },
  },
}

/** the public profile board: no in-app chrome, one bubblegum, and the return path rides in link state */
export const LoggedOutVisitor: Story = {
  args: {
    ...oneCreatedCard,
    showActions: false,
    showJoin: true,
    intro: 'A collection worth passing around · 1 meme · 0 in binder',
    identityLine: null,
    profile: {
      name: palProfile.name,
      avatarSrc: null,
      stats: [{ id: 'braincells', glyph: '🧠', text: '90 braincells held' }],
    },
  },
}

/** `/binder/:sub` seen by anyone but its owner: the title is the binder, the grid is the shelf. */
export const PublicBinder: Story = {
  args: {
    ...oneCreatedCard,
    showActions: false,
    showJoin: true,
    title: `${palProfile.name}'s binder`,
    intro: 'A collection worth passing around.',
    identityLine: null,
    showBinderHero: true,
    joinLabel: `Log in to trade with ${palProfile.name}`,
    createdTabButtonProps: { 'aria-pressed': false, 'aria-controls': 'profile-cards', onClick: fn() },
    binderTabButtonProps: { 'aria-pressed': true, 'aria-controls': 'profile-cards', onClick: fn() },
    binderCount: 1,
    profile: {
      name: palProfile.name,
      avatarSrc: null,
      stats: [
        { id: 'minted', glyph: '', text: '1 meme' },
        { id: 'binder', glyph: '', text: '1 in binder' },
        { id: 'braincells', glyph: '🧠', text: '90 braincells' },
      ],
    },
    cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: 'holds 12/100' }],
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': 'Binder memes, 1 card' },
  },
}

export const Following: Story = {
  args: {
    ...oneCreatedCard,
    followButtonVariant: 'default',
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
      avatarSrc: null,
      stats: statsFor(palProfile),
    },
  },
}

/** more cards than one page holds: the centred "Show N more" and its count caption. */
export const Paged: Story = {
  args: {
    ...oneCreatedCard,
    createdCount: 14,
    showMore: true,
    showMoreLabel: 'Show 2 more',
    gridCountLabel: 'Showing 12 of 14',
    cards: Array.from({ length: 12 }, (_value, index) => ({
      id: `created-${paperMeme.id}-${index}`,
      memeCard: buildMemeCardModel(paperMeme),
      sharesLabel: null,
    })),
  },
}

export const Dark: Story = { ...Following, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Following, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Following,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const PublicBinderDark: Story = {
  ...PublicBinder,
  name: 'Public binder dark',
  globals: { theme: 'dark' },
}

export const PublicBinderPhone390: Story = {
  ...PublicBinder,
  name: 'Public binder phone 390',
  ...phone,
}
