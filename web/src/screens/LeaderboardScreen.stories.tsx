import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
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
  subtitle: 'The wrinkliest braincell holders on MemeOn',
  columnHeaders: { player: 'Player', braincells: 'Braincells' },
  leaders: [],
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
    await expect(canvas.getByRole('list')).toBe(canvasElement.querySelector('ol.row-list'))
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
    await expect(canvasElement.querySelectorAll('.person-row .avatar')).toHaveLength(4)
  },
}

/** A picture that never decodes falls back to the player's monogram, not a torn-image glyph. */
export const BrokenAvatars: Story = {
  args: {
    ...ready,
    leaders: rows(realAccountRows),
    listSummary: '3 brains on the board',
  },
  play: async ({ canvasElement }) => {
    const avatars = canvasElement.querySelectorAll<HTMLImageElement>('.person-row img.avatar')
    await expect(avatars).toHaveLength(2)
    for (const avatar of avatars) await fireEvent.error(avatar)
    await expect(avatars[0]!.src).toContain('data:image/svg+xml')
    await expect(decodeURIComponent(avatars[0]!.src)).toContain('>A<')
    await expect(decodeURIComponent(avatars[1]!.src)).toContain('>I<')
    // a fallback that itself fails must not re-enter the swap
    await fireEvent.error(avatars[0]!)
    await expect(decodeURIComponent(avatars[0]!.src)).toContain('>A<')
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
