import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { leaderboardRows, meLou } from '../../.storybook/fixtures'
import { leaderboardCopy as copy } from '../copy/leaderboard'
import { buildLeaderboardRowModel, type LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'
import type { LeaderRow } from '../lib/types'
import { LeaderboardScreen } from './LeaderboardScreen'

/** Mix of avatars with and without profile pictures. */
const mixedAvatarRows: LeaderRow[] = [
  { sub: 'user-pal', name: 'pal', picture: '/brand/memeon-logo-circle-64.png', braincells: 240, portfolioValue: 90, collectionSize: 8 },
  { sub: 'user-lou', name: 'lou', picture: null, braincells: 120, portfolioValue: 40, collectionSize: 3 },
  { sub: 'user-dez', name: 'dez the unfurler', picture: '/brand/memeon-logo-circle-48.png', braincells: 95, portfolioValue: 30, collectionSize: 2 },
  { sub: 'user-smooth', name: 'smoothbrain', picture: null, braincells: 12, portfolioValue: 5, collectionSize: 1 },
]

/* Every Google-signed-in account carries an lh3.googleusercontent URL that can 404 or be
   rate-limited, and real display names are full names, not handles. */
const realAccountRows: LeaderRow[] = [
  { sub: 'user-broken', name: 'Alice Memerson-Whitfield', picture: 'https://lh3.googleusercontent.com/a/does-not-resolve=s96-c', braincells: 4174, portfolioValue: 30_000, collectionSize: 27 },
  { sub: 'user-issam', name: 'Issam Misto', picture: 'https://lh3.googleusercontent.com/a/also-gone=s96-c', braincells: 1290, portfolioValue: 1507, collectionSize: 7 },
  { sub: 'user-carol', name: 'Carol Newbraincell', picture: null, braincells: 48, portfolioValue: 12, collectionSize: 1 },
]

const rows = (source: LeaderRow[], meSub: string | null = null) =>
  source.map((leader, index) => buildLeaderboardRowModel(leader, index, meSub))

const empty: LeaderboardScreenModel = {
  phase: 'empty',
  subtitle: copy.subtitle,
  podiumTitle: copy.podium.title,
  podiumSubtitle: copy.podium.subtitle,
  columnHeaders: { player: copy.columns.player, braincells: copy.columns.braincells },
  leaders: [],
  youRow: null,
  showMore: false,
  showMoreLabel: copy.showMore,
  showMoreButtonProps: { onClick: () => {} },
  showLoading: false,
  loadingMessage: copy.loading,
  showEmpty: true,
  emptyMessage: copy.empty,
  showError: false,
  errorMessage: copy.loadError,
  retryLabel: copy.retry,
  retry: () => {},
  showList: false,
  listSummary: copy.listSummary(0),
  youLabel: copy.row.you,
}

const ready: Partial<LeaderboardScreenModel> = {
  phase: 'ready',
  showEmpty: false,
  showList: true,
  listSummary: copy.listSummary(2),
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
  title: 'Screens/LeaderboardScreen',
  component: LeaderboardScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LeaderboardScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', showEmpty: false, showLoading: true },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status')
    await expect(status).toHaveTextContent(copy.loading)
    await expect(status).toHaveAttribute('aria-busy', 'true')
  },
}

export const Empty: Story = {}

export const Error: Story = {
  name: 'Error',
  args: { phase: 'error', showEmpty: false, showError: true, retry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(copy.loadError)
    await expect(canvasElement.querySelector('[data-slot="empty"]')).toHaveAttribute('data-variant', 'error')
    await expect(canvas.queryByText(copy.empty)).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: copy.retry }))
    await expect(args.retry).toHaveBeenCalled()
  },
}

export const Ready: Story = {
  args: { ...ready, leaders: rows(leaderboardRows) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list').tagName).toBe('OL')
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
    await expect(canvas.getByRole('link', { name: copy.row.label(1, 'pal', 240) })).toHaveAttribute('href', '/u/user-pal')
    await expect(canvas.getByRole('status')).toHaveTextContent(copy.listSummary(2))
  },
}

/**
 * The podium's three tiles draw one `medal` glyph, so the metal and the numeral beside it are the
 * whole of what says first from third. This pins both: the class names are literal so a surface
 * token cannot slip back in (`text-warning`, the amber chip fill, was bronze and measured Lc 8),
 * and the numeral is asserted because the glyph engraves a fixed "1" whatever rank it is drawn for.
 */
export const Podium: Story = {
  args: { ...ready, leaders: rows(mixedAvatarRows), listSummary: copy.listSummary(4) },
  play: async ({ canvasElement }) => {
    const medals = canvasElement.querySelectorAll<HTMLElement>('[data-slot="podium-medal"]')

    await expect(medals).toHaveLength(3)
    await expect(medals[0]).toHaveClass('text-podium-gold')
    await expect(medals[1]).toHaveClass('text-podium-silver')
    await expect(medals[2]).toHaveClass('text-podium-bronze')
    await expect(medals[2]).toHaveTextContent('3')
    // decoration only: the rank is already inside the row's accessible name
    await expect(medals[0]).toHaveAttribute('aria-hidden', 'true')
    await expect(within(canvasElement).getByRole('link', { name: copy.row.label(1, 'pal', 240) })).toBeInTheDocument()
  },
}

export const MixedAvatars: Story = {
  args: {
    ...ready,
    leaders: rows(mixedAvatarRows),
    listSummary: copy.listSummary(4),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="person-row"] [data-slot="avatar"]')).toHaveLength(4)
    // the podium takes the podium disc, the ladder the rank disc
    const podium = canvasElement.querySelector('[data-slot="podium-cards"] [data-slot="avatar"]')
    await expect(podium).toHaveAttribute('data-size', 'podium')
    await expect(canvasElement.querySelector('[data-slot="leaderboard"] [data-slot="avatar"]')).toHaveAttribute('data-size', 'rank')
  },
}

/** A picture that never decodes falls back to the player's own monogram, not a torn-image glyph. */
export const BrokenAvatars: Story = {
  args: {
    ...ready,
    leaders: rows(realAccountRows),
    listSummary: copy.listSummary(3),
  },
  play: async ({ canvasElement }) => {
    const personRows = canvasElement.querySelectorAll<HTMLElement>('[data-slot="person-row"]')
    await expect(personRows).toHaveLength(3)
    // Carol never had a picture: her monogram renders immediately.
    await expect(within(personRows[2]!).getByText('C')).toBeInTheDocument()
    // Alice and Issam carry Google avatar URLs that 404: each falls back to its own monogram
    // instead of leaving a torn-image glyph in the circle.
    await waitFor(() => expect(within(personRows[0]!).getByText('A')).toBeInTheDocument())
    await waitFor(() => expect(within(personRows[1]!).getByText('I')).toBeInTheDocument())
    await expect(canvasElement.querySelectorAll('[data-slot="avatar"] img')).toHaveLength(0)
  },
}

export const SelfInTopTen: Story = {
  args: { ...ready, leaders: rows(leaderboardRows, meLou.sub) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.row.you)).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: copy.row.youLabel(copy.row.label(2, meLou.name, meLou.coins)) })).toBeInTheDocument()
    // rows are raised Items; the frame axis marks the podium's first place and your own row
    const rows = canvasElement.querySelectorAll('[data-slot="person-row"]')
    await expect(rows[0]).toHaveAttribute('data-variant', 'raised')
    await expect(rows[0]).toHaveAttribute('data-frame', 'primary')
    await expect(rows[1]).toHaveAttribute('data-frame', 'none')
    await expect(canvasElement.querySelector('[data-slot="your-rank"]')).toBeNull()
  },
}

/** Full page: podium, ranked rows, pinned "You" line, and load-more. */
export const Full: Story = {
  args: {
    ...ready,
    leaders: rows(mixedAvatarRows),
    listSummary: copy.listSummary(4),
    youRow: buildLeaderboardRowModel(
      { sub: 'user-me', name: 'oxfern', picture: null, braincells: 2480, portfolioValue: 900, collectionSize: 6 },
      8,
      'user-me',
    ),
    showMore: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="your-rank"]')).not.toBeNull()
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
