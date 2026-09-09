import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { paperMeme, questStepsFresh, questStepsPackDone, silverMeme } from '../../.storybook/fixtures'
import { buildQuestBarModel } from '../lib/questBarModel'
import { QuestBar } from './QuestBar'

const onClaimPack = fn()
const onDismissPack = fn()
const onToggleSteps = fn()
const onDismissSteps = fn()
const fresh = {
  steps: questStepsFresh,
  packMemes: null,
  packReward: 0,
  busy: false,
  onClaimPack,
  onDismissPack,
  onToggleSteps,
  onDismissSteps,
}

const meta = {
  title: 'Molecules/QuestBar',
  component: QuestBar,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: { model: buildQuestBarModel(fresh) },
} satisfies Meta<typeof QuestBar>

export default meta
type Story = StoryObj<typeof meta>

/** Default: the next step only, its instructions visible, the rest behind a disclosure. */
export const Fresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onToggleSteps.mockClear()
    onDismissSteps.mockClear()
    await expect(canvas.getByText('Earn your braincells ·')).toBeInTheDocument()
    await expect(canvas.getByText('0/5')).toBeInTheDocument()
    await expect(canvas.getByText(questStepsFresh[0]!.hint)).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: /Mint/ })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: /starter pack/i }))
    await expect(onClaimPack).toHaveBeenCalledTimes(1)

    const more = canvas.getByRole('button', { name: '4 more — show all quests' })
    await expect(more).toHaveTextContent('4 more')
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(more)
    await expect(onToggleSteps).toHaveBeenCalledTimes(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Later — hide quests for now' }))
    await expect(onDismissSteps).toHaveBeenCalledTimes(1)
  },
}

/** The full ladder, one chip per step, each carrying its own state and reward. */
export const Expanded: Story = {
  args: { model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone, expanded: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: /Mint/ })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByText('Done.')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Show less — hide the rest of your quests' }))
      .toHaveTextContent('Show less')
  },
}

export const Opening: Story = {
  args: { model: buildQuestBarModel({ ...fresh, busy: true }) },
  play: async ({ canvasElement }) => {
    onClaimPack.mockClear()
    const trigger = within(canvasElement).getByRole('button', { name: /Opening/ })
    await expect(trigger).toBeDisabled()
    await expect(trigger).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(trigger)
    await expect(onClaimPack).not.toHaveBeenCalled()
  },
}

/** A one-shot claim that fails silently is the worst state this strip can be in. */
export const ClaimFailed: Story = {
  args: {
    model: buildQuestBarModel({ ...fresh, claimError: "Pack didn't open — tap to try again." }),
  },
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert')
    await expect(alert).toHaveTextContent("Pack didn't open — tap to try again.")
  },
}

export const PackDone: Story = {
  args: { model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone }) },
}

export const PackOpened: Story = {
  args: {
    model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone, packMemes: [paperMeme, silverMeme], packReward: 20 }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onDismissPack.mockClear()
    const modal = canvas.getByRole('dialog', { name: /Starter pack opened/ })
    await expect(modal).toHaveAttribute('open')
    const cardLink = within(modal).getByRole('link', { name: new RegExp(paperMeme.title) })
    await expect(cardLink).toHaveAttribute('href', `/m/${paperMeme.id}`)

    await userEvent.click(within(modal).getByRole('button', { name: 'Close' }))
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
    onDismissPack.mockClear()
    await userEvent.click(within(modal).getByRole('button', { name: 'Keep exploring' }))
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
    onDismissPack.mockClear()
    /* one element, one tab stop: the binder exit is a link, not a button inside a link */
    await expect(within(modal).queryByRole('button', { name: 'View in My Binder' })).toBeNull()
    const binderLink = within(modal).getByRole('link', { name: 'View in My Binder' })
    await expect(binderLink).toHaveAttribute('href', '/binder')
    await userEvent.click(binderLink)
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
  },
}

/** Escape is the exit a keyboard user reaches for; the native dialog supplies it. */
export const PackOpenedKeyboard: Story = {
  args: {
    model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone, packMemes: [paperMeme], packReward: 20 }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onDismissPack.mockClear()
    const modal = canvas.getByRole('dialog', { name: /Starter pack opened/ })
    await expect(within(modal).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    /* Escape is the platform's own cancel on a showModal() dialog; a synthetic key event cannot
       run that default action, so the story proves the close wiring the platform will fire. */
    ;(modal as HTMLDialogElement).close()
    await waitFor(() => expect(onDismissPack).toHaveBeenCalledTimes(1))
    await expect(modal).not.toHaveAttribute('open')
  },
}

export const EmptyVault: Story = {
  args: {
    model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone, packMemes: [], packReward: 20 }),
  },
}

export const Hidden: Story = {
  args: { model: buildQuestBarModel({ ...fresh, steps: [] }) },
}
