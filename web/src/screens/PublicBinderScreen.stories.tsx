import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { friendAccepted, giftablePaper } from '../../.storybook/fixtures'
import { profileCopy } from '../copy/profile'
import type { ProfileScreenModel } from '../hooks/useProfileScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { PublicBinderScreen } from './PublicBinderScreen'

const palProfile = {
  sub: friendAccepted.sub,
  name: friendAccepted.name,
  picture: friendAccepted.picture,
  followers: 4,
  collectionSize: friendAccepted.collectionSize,
  portfolioValue: friendAccepted.portfolioValue,
}

const handlers = {
  tabsProps: { value: 'binder', onValueChange: fn() },
  followButtonProps: { 'aria-pressed': false, 'aria-busy': false, disabled: false, onClick: fn() },
  friendButtonProps: { 'aria-busy': false, disabled: false, onClick: fn() },
  retryButtonProps: { onClick: fn() },
  shareButtonProps: { onClick: fn() },
  showMoreButtonProps: { onClick: fn() },
} satisfies Partial<ProfileScreenModel>

const tabLabels = (createdCount: number, binderCount: number) => ({
  createdCount,
  binderCount,
  createdTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.created, createdCount),
  binderTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.binder, binderCount),
})

const publicBinder: ProfileScreenModel = {
  showErr: false,
  errTitle: profileCopy.loadError.transport.title,
  errBody: profileCopy.loadError.transport.body,
  retryLabel: profileCopy.loadError.retry,
  errorLinkLabel: profileCopy.loadError.browse,
  errorLinkProps: { to: '/marketplace' },
  showLoading: false,
  loadingLabel: profileCopy.loading,
  documentTitle: profileCopy.documentTitle.binder,
  title: profileCopy.hero.binderTitle(palProfile.name),
  intro: profileCopy.hero.publicIntro,
  identityLine: null,
  showBinderHero: true,
  tradeLabel: profileCopy.actions.trade,
  tradeLinkProps: { to: '/trade', 'aria-label': profileCopy.actions.tradeWith(palProfile.name) },
  shareLabel: profileCopy.actions.share,
  showSelfActions: false,
  settingsLabel: profileCopy.actions.settings,
  settingsLinkProps: { to: '/settings' },
  reshareNote: profileCopy.join.reshareNote,
  gridCountLabel: profileCopy.grid.count(1, 1),
  showMore: false,
  showMoreLabel: profileCopy.grid.showMore(12),
  profile: {
    name: palProfile.name,
    avatarSrc: null,
    stats: [
      { id: 'minted', glyph: null, text: profileCopy.stats.minted(1) },
      { id: 'binder', glyph: null, text: profileCopy.stats.inBinder(1) },
      { id: 'braincells', glyph: 'brain', text: profileCopy.stats.braincells(palProfile.portfolioValue) },
    ],
  },
  showActions: false,
  followButtonVariant: 'default',
  followGlyph: 'star',
  followText: profileCopy.actions.follow.label,
  showFriendButton: true,
  friendGlyph: 'hand',
  friendText: profileCopy.actions.friend.add,
  showFriendChip: false,
  friendChipGlyph: 'handshake',
  friendChipText: profileCopy.actions.friendChip.friends,
  showActionErr: false,
  actionErr: '',
  showJoin: true,
  joinLabel: profileCopy.join.trade(palProfile.name),
  joinAddFriendLabel: profileCopy.join.addFriend,
  joinLinkProps: { to: '/', state: { next: '/binder/user-pal' } },
  actionsGroupLabel: profileCopy.actions.groupLabel,
  tabsListLabel: profileCopy.tabs.section,
  ...tabLabels(1, 1),
  cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: profileCopy.cards.holds(12) }],
  showEmpty: false,
  emptyTitle: '',
  emptyBody: '',
  showEmptyLink: false,
  emptyLinkLabel: '',
  emptyLinkProps: { to: '/marketplace' },
  showGrid: true,
  gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': profileCopy.grid.label(profileCopy.tabs.binder, 1) },
  ...handlers,
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
  title: 'Screens/PublicBinderScreen',
  component: PublicBinderScreen,
  args: publicBinder,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof PublicBinderScreen>

export default meta
type Story = StoryObj<typeof meta>

/** `/binder/:sub` seen by anyone but its owner: the title is the binder, the grid is the shelf. */
export const PublicBinder: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { name: profileCopy.hero.binderTitle(palProfile.name) })).toBeInTheDocument()
  },
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
