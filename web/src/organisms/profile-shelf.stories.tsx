import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { giftablePaper, paperMeme } from '../../.storybook/fixtures'
import { profileCopy } from '../copy/profile'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { ProfileShelf, type ProfileShelfModel } from './profile-shelf'

const handlers = {
  tabsProps: { value: 'created' as const, onValueChange: fn() },
  showMoreButtonProps: { onClick: fn() },
}

const emptyShelf: ProfileShelfModel = {
  ...handlers,
  tabsListLabel: profileCopy.tabs.section,
  createdTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.created, 0),
  binderTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.binder, 0),
  gridProps: {
    id: 'profile-cards',
    'aria-live': 'polite',
    'aria-label': profileCopy.grid.label(profileCopy.tabs.created, 0),
  },
  showEmpty: true,
  emptyTitle: profileCopy.empty.other.created.title('pal'),
  emptyBody: profileCopy.empty.other.created.body,
  showEmptyLink: false,
  emptyLinkLabel: '',
  emptyLinkProps: { to: '/marketplace' },
  showGrid: false,
  cards: [],
  gridCountLabel: profileCopy.grid.count(0, 0),
  showMore: false,
  showMoreLabel: profileCopy.grid.showMore(12),
}

const meta = {
  title: 'Organisms/ProfileShelf',
  component: ProfileShelf,
  args: emptyShelf,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof ProfileShelf>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelector('[data-slot="profile-shelf"]')).toBeInTheDocument()
    await expect(canvas.getByRole('tab', { name: profileCopy.tabs.trigger(profileCopy.tabs.created, 0) })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: profileCopy.empty.other.created.title('pal') })).toBeInTheDocument()
  },
}

export const Grid: Story = {
  args: {
    showEmpty: false,
    showGrid: true,
    createdTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.created, 1),
    binderTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.binder, 0),
    gridProps: {
      id: 'profile-cards',
      'aria-live': 'polite',
      'aria-label': profileCopy.grid.label(profileCopy.tabs.created, 1),
    },
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
    gridCountLabel: profileCopy.grid.count(1, 1),
  },
}

export const BinderTab: Story = {
  args: {
    tabsProps: { value: 'binder', onValueChange: fn() },
    showEmpty: false,
    showGrid: true,
    createdTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.created, 0),
    binderTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.binder, 1),
    gridProps: {
      id: 'profile-cards',
      'aria-live': 'polite',
      'aria-label': profileCopy.grid.label(profileCopy.tabs.binder, 1),
    },
    cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: profileCopy.cards.holds(12) }],
    gridCountLabel: profileCopy.grid.count(1, 1),
  },
}

export const ShowMore: Story = {
  args: {
    showEmpty: false,
    showGrid: true,
    createdTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.created, 14),
    binderTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.binder, 0),
    showMore: true,
    showMoreLabel: profileCopy.grid.showMore(2),
    gridCountLabel: profileCopy.grid.count(12, 14),
    gridProps: {
      id: 'profile-cards',
      'aria-live': 'polite',
      'aria-label': profileCopy.grid.label(profileCopy.tabs.created, 12),
    },
    cards: Array.from({ length: 12 }, (_value, index) => ({
      id: `created-${paperMeme.id}-${index}`,
      memeCard: buildMemeCardModel(paperMeme),
      sharesLabel: null,
    })),
  },
}
