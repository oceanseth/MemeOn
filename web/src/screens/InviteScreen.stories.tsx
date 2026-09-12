import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { inviteLou, invitePal } from '../../.storybook/fixtures'
import { buildInviteStats, type InviteScreenModel } from '../hooks/useInviteScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { InviteScreen } from './InviteScreen'

/** Story-local: both shared invite fixtures resolve to `picture: null`, so the image branch needs one. */
const pictured = {
  ...invitePal,
  inviter: { ...invitePal.inviter, picture: '/brand/memeon-logo-circle-256.png' },
}

const inviteModel = (data: typeof invitePal, self = false) => ({
  name: data.inviter.name,
  avatarSrc: data.inviter.picture,
  stats: buildInviteStats(data.inviter),
  acceptanceNote: self
    ? "Send this link to a friend — they'll join with Masky and you'll be friends instantly."
    : `Sign in with your Masky avatar. You start with a free starter pack and ${data.inviter.name} as your first friend.`,
})

const cardsOf = (data: typeof invitePal) =>
  data.topMemes.map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) }))

const empty: InviteScreenModel = {
  phase: 'loading',
  err: null,
  showFatalError: false,
  showSpinner: true,
  showAcceptError: false,
  showAcceptSuccess: false,
  showAcceptSpinner: false,
  showHighlights: false,
  loadingLabel: 'Loading invite…',
  inviteBody: 'Mint memes, share the link, and trade your friends’ bangers before they go ✨Shiny✨.',
  climbNote: 'Every share makes the card climb.',
  acceptErrorMessage: "Couldn't accept this invite — try again.",
  acceptSuccessMessage: 'You and pal are now friends 🤝',
  highlightsTitle: "pal's binder highlights",
  fatalActions: {
    title: 'This invite link expired',
    joinLabel: '🎭 Join MemeOn anyway',
    joinButtonProps: { onClick: fn() },
    homeLabel: 'Back to MemeOn',
    homeHref: '/',
  },
  selfActions: null,
  inviter: null,
  cards: [],
  acceptButtonProps: { onClick: fn() },
  acceptLabel: '🎭 Join pal on MemeOn',
}

const ready = {
  phase: 'ready',
  inviter: inviteModel(invitePal),
  cards: cardsOf(invitePal),
  showSpinner: false,
  showHighlights: true,
} satisfies Partial<InviteScreenModel>

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
  title: 'Screens/InviteScreen',
  component: InviteScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof InviteScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}

/** Dead link: an explanation plus the two ways forward, never a bare red bar. */
export const Error: Story = {
  args: {
    phase: 'error',
    err: 'This invite link is invalid or expired.',
    showFatalError: true,
    showSpinner: false,
  },
}

/** The recovery leg of the dead link: Masky signup is in flight. */
export const ErrorJoining: Story = {
  args: {
    phase: 'accepting',
    err: 'This invite link is invalid or expired.',
    showFatalError: true,
    showSpinner: false,
    fatalActions: {
      ...empty.fatalActions,
      joinLabel: '🎭 Opening Masky…',
      joinButtonProps: { onClick: fn(), 'aria-disabled': true, 'aria-busy': true },
    },
  },
}

export const Ready: Story = { args: ready }

/** Masky supplied a picture, so the ring carries the face instead of the monogram. */
export const WithAvatar: Story = {
  args: { ...ready, inviter: inviteModel(pictured), cards: cardsOf(pictured) },
}

export const LoggedIn: Story = {
  args: { ...ready, acceptLabel: '🤝 Accept & befriend pal' },
}

export const Accepting: Story = {
  args: {
    ...ready,
    phase: 'accepting',
    acceptButtonProps: { onClick: fn(), 'aria-disabled': true, 'aria-busy': true },
    showAcceptSpinner: true,
    acceptLabel: '🤝 Adding pal…',
  },
}

export const AcceptError: Story = {
  args: {
    ...ready,
    err: 'invite already used',
    showAcceptError: true,
  },
}

/** The promise landing: the friendship is confirmed before the route changes. */
export const Accepted: Story = {
  args: {
    ...ready,
    showAcceptSuccess: true,
  },
}

const selfActions = {
  note: 'This is your own invite link — send it to a friend!',
  copyLabel: '🔗 Copy invite link',
  copyStatusMessage: '',
  copyButtonProps: { onClick: fn() },
  friendsLabel: 'See your friends',
  friendsHref: '/friends',
}

export const Self: Story = {
  args: {
    phase: 'ready',
    inviter: inviteModel(inviteLou, true),
    cards: cardsOf(inviteLou),
    highlightsTitle: "lou's binder highlights",
    selfActions,
    showSpinner: false,
    showHighlights: true,
  },
}

export const SelfCopied: Story = {
  args: {
    ...Self.args,
    selfActions: {
      ...selfActions,
      copyLabel: '✅ Link copied',
      copyStatusMessage: 'Invite link copied to your clipboard.',
    },
  },
}

export const Dark: Story = { ...Ready, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Ready, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Ready,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
