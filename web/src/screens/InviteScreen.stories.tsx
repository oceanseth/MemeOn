import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { inviteLou, invitePal } from '../../.storybook/fixtures'
import type { InviteScreenModel } from '../hooks/useInviteScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { InviteScreen } from './InviteScreen'

const inviteModel = (data: typeof invitePal) => ({
  name: data.inviter.name,
  hasPicture: !!data.inviter.picture,
  imageProps: { src: data.inviter.picture ?? '', alt: data.inviter.name },
  statsLabel: `📚 ${data.inviter.collectionSize} memes collected · 🧠 ${data.inviter.portfolioValue.toLocaleString()} portfolio · ⭐ ${data.inviter.followers} followers`,
  acceptanceNote: `Joining creates your account with Masky single sign-on and instantly makes you and ${data.inviter.name} friends.`,
})

const empty: InviteScreenModel = {
  phase: 'loading',
  err: null,
  isSelf: false,
  showFatalError: false,
  showSpinner: true,
  showAcceptError: false,
  showHighlights: false,
  inviter: null,
  cards: [],
  acceptButtonProps: { onClick: fn(), disabled: false },
  acceptLabel: '🎭 Accept invite — join with Masky',
}

const meta = {
  title: 'Screens/InviteScreen',
  component: InviteScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof InviteScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}

export const Error: Story = {
  args: {
    phase: 'error',
    err: 'This invite link is invalid or expired.',
    showFatalError: true,
    showSpinner: false,
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    inviter: inviteModel(invitePal),
    cards: invitePal.topMemes.map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    showSpinner: false,
    showHighlights: true,
  },
}

export const LoggedIn: Story = {
  args: {
    phase: 'ready',
    inviter: inviteModel(invitePal),
    cards: invitePal.topMemes.map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    showSpinner: false,
    showHighlights: true,
    acceptLabel: '🤝 Accept & befriend pal',
  },
}

export const Self: Story = {
  args: {
    phase: 'ready',
    inviter: inviteModel(inviteLou),
    cards: inviteLou.topMemes.map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    isSelf: true,
    showSpinner: false,
    showHighlights: true,
  },
}

export const Accepting: Story = {
  args: {
    phase: 'accepting',
    inviter: inviteModel(invitePal),
    cards: invitePal.topMemes.map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    acceptButtonProps: { onClick: fn(), disabled: true },
    showSpinner: false,
    showHighlights: true,
    acceptLabel: 'Opening Masky…',
  },
}

export const AcceptError: Story = {
  args: {
    phase: 'ready',
    inviter: inviteModel(invitePal),
    cards: invitePal.topMemes.map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    err: 'something went wrong',
    showSpinner: false,
    showAcceptError: true,
    showHighlights: true,
  },
}
