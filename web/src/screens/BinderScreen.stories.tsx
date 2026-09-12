import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { giftablePaper, holoMeme, paperMeme, silverMeme } from '../../.storybook/fixtures'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import { BinderScreen } from './BinderScreen'

/** the 390 × 844 twin every screen in this swarm carries beside its desktop story */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const card = (
  meme: typeof paperMeme,
  shares: number,
  extra: { showCreator?: boolean; showPrivate?: boolean } = {},
): BinderScreenModel['cards'][number] => {
  const memeCard = buildMemeCardModel(meme)
  return {
    id: meme.id,
    memeCard,
    ariaLabel: [
      meme.title,
      memeCard.tierLabel,
      `${shares}/100 shares`,
      extra.showCreator ? 'you minted this' : null,
      extra.showPrivate ? 'private' : null,
    ]
      .filter(Boolean)
      .join(' · '),
    sharesLabel: `${shares}/100 shares`,
    sharesPct: shares,
    showCreator: !!extra.showCreator,
    showPrivate: !!extra.showPrivate,
  }
}

const empty: BinderScreenModel = {
  phase: 'empty',
  intro: 'Your corner of the internet. In card form.',
  identity: null,
  statusProps: { role: 'status', 'aria-live': 'polite' },
  statusMessage: 'No cards shown · newest first',
  collectionHeading: 'Your collection',
  showPrivateToggle: false,
  privateCount: 0,
  privateToggleLabel: 'Show private (0)',
  privateToggleProps: { checked: false, onCheckedChange: fn() },
  sortChips: buildSortChipsModel({ sortKey: 'new', dir: 'desc', onChange: fn() }),
  createLinkProps: { to: '/binder/new' },
  createLabel: 'Mint a meme',
  cards: [],
  showMore: null,
  showLoading: false,
  showEmpty: true,
  emptyMessage: 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.',
  emptyAction: { kind: 'create', label: '＋ Mint your first meme', linkProps: { to: '/binder/new' } },
  showError: false,
  errorTitle: "Couldn't load your binder.",
  errorMessage: 'Your cards are safe — nothing was lost. Give it another go.',
  retryProps: { onClick: fn() },
  showGrid: false,
}

const meta = {
  title: 'Screens/BinderScreen',
  component: BinderScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof BinderScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: {
    phase: 'loading',
    statusMessage: 'Loading your binder…',
    showEmpty: false,
    emptyAction: null,
    showLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading your binder…')
    await expect(canvasElement.querySelectorAll('[data-slot="skeleton-card"]')).toHaveLength(6)
  },
}

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: /Mint your first meme/ })).toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent('No cards shown')
  },
}

export const Error: Story = {
  args: {
    phase: 'error',
    statusMessage: 'No cards loaded',
    showEmpty: false,
    emptyAction: null,
    showError: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = canvas.getByRole('alert')
    await expect(alert).toHaveTextContent("Couldn't load your binder.")
    await expect(alert).toHaveTextContent('Your cards are safe')
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    await expect(canvas.queryByText(/binder is empty/i)).not.toBeInTheDocument()
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    statusMessage: '3 cards shown · newest first · 🧠 186',
    showEmpty: false,
    emptyAction: null,
    showGrid: true,
    cards: [
      card(giftablePaper, 8),
      card(silverMeme, 42, { showCreator: true }),
      card(holoMeme, 100),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3)
    await expect(canvas.getByRole('listitem', { name: /8\/100 shares/ })).toBeInTheDocument()
    await expect(canvas.getByRole('group', { name: /Sort and filter/ })).toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent('3 cards shown')
  },
}

export const AllPrivate: Story = {
  args: {
    phase: 'ready',
    showPrivateToggle: true,
    privateCount: 2,
    privateToggleLabel: 'Show private (2)',
    emptyMessage: 'All 2 of your memes are private. Turn on "Show private" to see them.',
    emptyAction: { kind: 'showPrivate', label: 'Show private (2)', onClick: fn() },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('No cards shown')
    await expect(canvas.getByText(/All 2 of your memes are private/)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Show private (2)' })).toBeInTheDocument()
  },
}

export const ShowingPrivate: Story = {
  args: {
    phase: 'ready',
    statusMessage: '1 card shown · newest first · 🧠 62 · private included',
    showEmpty: false,
    emptyAction: null,
    showGrid: true,
    showPrivateToggle: true,
    privateCount: 1,
    privateToggleLabel: 'Show private (1)',
    privateToggleProps: { checked: true, onCheckedChange: fn() },
    cards: [card(paperMeme, 4, { showCreator: true, showPrivate: true })],
  },
}

/** Full binder page: identity, toolbar, grid. Reward rail is the shell QuestBar, not duplicated here. */
export const Full: Story = {
  name: 'Ready (identity, toolbar, paging)',
  args: {
    ...Ready.args,
    identity: { name: 'oxfern', pictureUrl: null, statsLabel: '3 cards · 150 shares' },
    showPrivateToggle: true,
    privateCount: 1,
    privateToggleLabel: 'Show private (1)',
    statusMessage: '3 of 15 cards shown · newest first · 🧠 186',
    showMore: { label: 'Show 12 more', onClick: fn() },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Show 12 more' })).toBeInTheDocument()
    /* the grid is the page's only list: three cards, no second rail list above it */
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3)
    /* toolbar order: Show private → sort → Mint */
    const lane = canvas.getByRole('group', { name: 'Sort and filter your binder' })
    await expect(lane.children).toHaveLength(3)
    await expect(lane.firstElementChild).toHaveTextContent('Show private (1)')
    await expect(lane.children[1]?.querySelector('[data-slot="sort-chips"]')).not.toBeNull()
    await expect(lane.lastElementChild).toHaveTextContent('Mint a meme')
  },
}

export const Dark: Story = { ...Full, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Full, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Full,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
