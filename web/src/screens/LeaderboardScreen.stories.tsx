import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { leaderboardRows, meLou } from '../../.storybook/fixtures'
import { buildLeaderboardRowModel, type LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'
import type { LeaderRow } from '../lib/types'
import { LeaderboardScreen } from './LeaderboardScreen'

/** Production boards mix players who set a picture with players who never did. */
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
  subtitle: 'Collect, trade, climb.',
  podiumTitle: '🏆 Podium',
  podiumSubtitle: 'The wrinkliest braincell holders on MemeOn',
  columnHeaders: { player: 'Ranked by braincell holdings', braincells: 'Braincells' },
  leaders: [],
  youRow: null,
  showMore: false,
  showMoreLabel: 'Show more brains',
  showMoreButtonProps: { onClick: () => {} },
  showLoading: false,
  loadingMessage: 'Loading Top Brains…',
  showEmpty: true,
  emptyMessage: "Nobody's earned a braincell yet. The throne is empty.",
  showError: false,
  errorMessage: "Couldn't load Top Brains.",
  retryLabel: 'Try again',
  retry: () => {},
  showList: false,
  listSummary: '0 brains on the board',
  youLabel: 'you',
}

const ready: Partial<LeaderboardScreenModel> = {
  phase: 'ready',
  showEmpty: false,
  showList: true,
  listSummary: '2 brains on the board',
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
    await expect(status).toHaveTextContent('Loading Top Brains')
    await expect(status).toHaveAttribute('aria-busy', 'true')
  },
}

export const Empty: Story = {}

export const Error: Story = {
  name: 'Error',
  args: { phase: 'error', showEmpty: false, showError: true, retry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent("Couldn't load Top Brains.")
    await expect(canvas.queryByText(/throne is empty/i)).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(args.retry).toHaveBeenCalled()
  },
}

export const Ready: Story = {
  args: { ...ready, leaders: rows(leaderboardRows) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list').tagName).toBe('OL')
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
    await expect(canvas.getByRole('link', { name: 'Rank 1, pal, 240 braincells' })).toHaveAttribute('href', '/u/user-pal')
    await expect(canvas.getByRole('status')).toHaveTextContent('2 brains on the board')
  },
}

export const MixedAvatars: Story = {
  args: {
    ...ready,
    leaders: rows(mixedAvatarRows),
    listSummary: '4 brains on the board',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="person-row"] [data-slot="avatar"]')).toHaveLength(4)
  },
}

/** A picture that never decodes falls back to the player's own monogram, not a torn-image glyph. */
export const BrokenAvatars: Story = {
  args: {
    ...ready,
    leaders: rows(realAccountRows),
    listSummary: '3 brains on the board',
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
    await expect(canvas.getByText('you')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: /^You, rank 2/ })).toBeInTheDocument()
  },
}

/** The full board: a podium, ranked rows beneath it, a pinned "You" line and the next page. */
export const Full: Story = {
  args: {
    ...ready,
    leaders: rows(mixedAvatarRows),
    listSummary: '4 brains on the board',
    youRow: buildLeaderboardRowModel(
      { sub: 'user-me', name: 'oxfern', picture: null, braincells: 2480, portfolioValue: 900, collectionSize: 6 },
      8,
      'user-me',
    ),
    showMore: true,
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
