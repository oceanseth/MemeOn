import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { paperMeme, questStepsFresh, questStepsPackDone, silverMeme } from '../../.storybook/fixtures'
import { buildQuestBarModel } from '../lib/questBarModel'
import { QuestBar } from '@/molecules/quest-bar'

const onClaimPack = fn()
const onDismissPack = fn()
const onDismissSteps = fn()
const fresh = {
  steps: questStepsFresh,
  packMemes: null,
  packReward: 0,
  busy: false,
  onClaimPack,
  onDismissPack,
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

/** Whole ladder in one lane, the meter under the title, claim pill beside it. */
export const Fresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onDismissSteps.mockClear()
    await expect(canvas.getByText(/Earn your braincells/)).toBeInTheDocument()
    await expect(canvas.getByText('0/5')).toBeInTheDocument()
    /* the meter is named by the title beside it and counts the same ladder the chips list */
    const meter = canvas.getByRole('progressbar', { name: /Earn your braincells/ })
    await expect(meter).toHaveAttribute('data-slot', 'questbar-progress')
    await expect(meter).toHaveAttribute('aria-valuenow', '0')
    await expect(meter).toHaveAttribute('aria-valuemax', String(questStepsFresh.length))
    await expect(meter.querySelector('[data-slot="progress-track"]')).not.toBeNull()
    /* hint is sr-only — visible quests leave nothing to hover for instructions */
    await expect(canvas.getByText(questStepsFresh[0]!.hint)).toBeInTheDocument()
    /* every quest is on the rail from the first render — nothing waits behind a disclosure */
    await expect(canvas.getByRole('link', { name: /Mint/ })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByRole('link', { name: /trade/i })).toBeInTheDocument()
    const claim = canvas.getByRole('button', { name: /starter pack/i })
    await expect(claim).toHaveAttribute('data-slot', 'quest-claim')
    await userEvent.click(claim)
    await expect(onClaimPack).toHaveBeenCalledTimes(1)

    const later = canvas.getByRole('button', { name: 'Later — hide quests for now' })
    await expect(later).toHaveAttribute('data-slot', 'quest-later')
    await userEvent.click(later)
    await expect(onDismissSteps).toHaveBeenCalledTimes(1)
  },
}

/** The ladder once the pack is claimed: one chip per step, each with its own state and reward. */
export const Expanded: Story = {
  args: { model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: /Mint/ })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByText('Done.')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /show all quests/i })).toBeNull()
    const done = questStepsPackDone.filter((step) => step.done).length
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(done))
  },
}

/** The one-shot claim in flight: disabled and busy, so a second press does nothing. */
export const Opening: Story = {
  args: { model: buildQuestBarModel({ ...fresh, busy: true }) },
  play: async ({ canvasElement }) => {
    onClaimPack.mockClear()
    const trigger = within(canvasElement).getByRole('button', { name: /Opening/ })
    await expect(trigger).toBeDisabled()
    await expect(trigger).toHaveAttribute('aria-busy', 'true')
    await expect(trigger.querySelector('[data-slot="spinner"]')).not.toBeNull()
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
    await expect(alert).toHaveAttribute('data-slot', 'questbar-error')
    await expect(alert).toHaveAttribute('data-variant', 'error')
  },
}

/** The inventory's name for the same state `Expanded` asserts against. */
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
    // the atom fades in, so visibility is a wait, not a read
    await waitFor(() => expect(modal).toBeVisible())
    await expect(modal.querySelector('[data-slot="pack-grid"]')).not.toBeNull()
    await expect(modal.querySelector('[data-slot="dialog-footer"]')).not.toBeNull()
    const cardLink = within(modal).getByRole('link', { name: new RegExp(paperMeme.title) })
    await expect(cardLink).toHaveAttribute('href', `/m/${paperMeme.id}`)

    await userEvent.click(within(modal).getByRole('button', { name: 'Close' }))
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
    onDismissPack.mockClear()
    await userEvent.click(within(modal).getByRole('button', { name: 'Keep exploring' }))
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
    onDismissPack.mockClear()
    /* one element, one tab stop: the binder exit is a link wearing the pill, not a button inside a link */
    await expect(within(modal).queryByRole('button', { name: 'View in My Binder' })).toBeNull()
    const binderLink = within(modal).getByRole('link', { name: 'View in My Binder' })
    await expect(binderLink).toHaveAttribute('href', '/binder')
    await expect(binderLink.offsetHeight).toBe(within(modal).getByRole('button', { name: 'Keep exploring' }).offsetHeight)
    await userEvent.click(binderLink)
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
  },
}

/**
 * Escape is the exit a keyboard user reaches for; Base UI's Dialog supplies it. The frame is
 * controlled, so the story owns the state the dismissal reports into — exactly as the shell does.
 */
function StatefulPack() {
  const [packMemes, setPackMemes] = useState<typeof paperMeme[] | null>([paperMeme])
  return (
    <QuestBar
      model={buildQuestBarModel({
        ...fresh,
        steps: questStepsPackDone,
        packMemes,
        packReward: 20,
        onDismissPack: () => {
          onDismissPack()
          setPackMemes(null)
        },
      })}
    />
  )
}

export const PackOpenedKeyboard: Story = {
  args: {
    model: buildQuestBarModel({ ...fresh, steps: questStepsPackDone, packMemes: [paperMeme], packReward: 20 }),
  },
  render: () => <StatefulPack />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onDismissPack.mockClear()
    const modal = canvas.getByRole('dialog', { name: /Starter pack opened/ })
    await expect(within(modal).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(onDismissPack).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())
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

export const Dark: Story = { ...Fresh, globals: { theme: 'dark' } }
