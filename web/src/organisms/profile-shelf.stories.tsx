import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { giftablePaper, paperMeme } from '../../.storybook/fixtures'
import { profileCopy } from '../copy/profile'
import type { ProfileShelfModel } from '../hooks/useProfileScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { ProfileShelf } from '@/organisms/profile-shelf'

const tabLabels = (createdCount: number, binderCount: number) => ({
  createdTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.created, createdCount),
  binderTabLabel: profileCopy.tabs.trigger(profileCopy.tabs.binder, binderCount),
})

const emptyShelf: ProfileShelfModel = {
  tabsListLabel: profileCopy.tabs.section,
  ...tabLabels(0, 0),
  cards: [],
  gridCountLabel: profileCopy.grid.count(0, 0),
  showMore: false,
  showMoreLabel: profileCopy.grid.showMore(12),
  showMoreButtonProps: { onClick: fn() },
  showEmpty: true,
  emptyTitle: profileCopy.empty.other.created.title('pal'),
  emptyBody: profileCopy.empty.other.created.body,
  showEmptyLink: false,
  emptyLinkLabel: '',
  emptyLinkProps: { to: '/marketplace' },
  showGrid: false,
  tabsProps: { value: 'created', onValueChange: fn() },
  gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': profileCopy.grid.label(profileCopy.tabs.created, 0) },
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
    await expect(canvas.getByRole('tablist', { name: profileCopy.tabs.section })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: profileCopy.empty.other.created.title('pal') })).toBeInTheDocument()
  },
}

export const Grid: Story = {
  args: {
    showEmpty: false,
    showGrid: true,
    ...tabLabels(1, 0),
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': profileCopy.grid.label(profileCopy.tabs.created, 1) },
    cards: [{ id: `created-${paperMeme.id}`, memeCard: buildMemeCardModel(paperMeme), sharesLabel: null }],
  },
}

export const Paged: Story = {
  args: {
    showEmpty: false,
    showGrid: true,
    ...tabLabels(14, 0),
    showMore: true,
    showMoreLabel: profileCopy.grid.showMore(2),
    gridCountLabel: profileCopy.grid.count(12, 14),
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': profileCopy.grid.label(profileCopy.tabs.created, 12) },
    cards: Array.from({ length: 12 }, (_value, index) => ({
      id: `created-${paperMeme.id}-${index}`,
      memeCard: buildMemeCardModel(paperMeme),
      sharesLabel: null,
    })),
  },
}

export const BinderGrid: Story = {
  args: {
    showEmpty: false,
    showGrid: true,
    tabsProps: { value: 'binder', onValueChange: fn() },
    ...tabLabels(0, 1),
    gridProps: { id: 'profile-cards', 'aria-live': 'polite', 'aria-label': profileCopy.grid.label(profileCopy.tabs.binder, 1) },
    cards: [{ id: `binder-${giftablePaper.id}`, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: profileCopy.cards.holds(12) }],
  },
}

export const Dark: Story = { ...Grid, name: 'Ready dark', globals: { theme: 'dark' } }
