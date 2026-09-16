import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { meLou, paperMeme, questStepsFresh, questStepsPackDone, silverMeme } from '../../.storybook/fixtures'
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

const balance = { text: `🧠 ${meLou.coins.toLocaleString()}`, label: `${meLou.coins.toLocaleString()} braincells` }

/** The ladder mounted open, as the shell shows it after a press on the pill. */
const open = (model: ReturnType<typeof buildQuestBarModel>) => ({ ...model, defaultOpen: true })

const meta = {
  title: 'Molecules/QuestBar',
  component: QuestBar,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex min-h-140 items-start justify-end p-6">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: { model: buildQuestBarModel(fresh), balance },
} satisfies Meta<typeof QuestBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The pill wears the ring at nothing and the claim dot; a press opens the whole ladder — title
 * and count, the meter, every quest with its reward, the claim pill, Later.
 */
export const Fresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onDismissSteps.mockClear()
    onClaimPack.mockClear()
    const trigger = canvas.getByRole('button', { name: /braincells, quests 0 of 5/ })
    await expect(trigger).toHaveAttribute('data-slot', 'quest-trigger')
    await expect(trigger).toHaveAttribute('data-progress', '0')
    await expect(trigger).toHaveTextContent('🧠 120')
    await expect(trigger.querySelector('[data-slot="quest-claim-dot"]')).not.toBeNull()
    /* the pill is a true pill, so the ring's `border-radius: inherit` hugs it */
    await expect(getComputedStyle(trigger).borderRadius).toBe('3.35544e+07px')
    await userEvent.click(trigger)
    await expect(await canvas.findByText('Earn your braincells')).toBeInTheDocument()
    await expect(canvas.getByText('0/5')).toBeInTheDocument()
    /* the meter is named by the title beside it and counts the same ladder the rows list */
    const meter = canvas.getByRole('progressbar', { name: /Earn your braincells/ })
    await expect(meter).toHaveAttribute('data-slot', 'questbar-progress')
    await expect(meter).toHaveAttribute('aria-valuenow', '0')
    await expect(meter).toHaveAttribute('aria-valuemax', String(questStepsFresh.length))
    await expect(meter.querySelector('[data-slot="progress-track"]')).not.toBeNull()
    /* hint is sr-only — visible quests leave nothing to hover for instructions */
    await expect(canvas.getByText(questStepsFresh[0]!.hint)).toBeInTheDocument()
    /* every quest is in the panel from the first render — nothing waits behind a disclosure */
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

/** The ladder once the pack is claimed: the ring reads a fifth, one row per step, each with its own state and reward. */
export const Expanded: Story = {
  args: { model: open(buildQuestBarModel({ ...fresh, steps: questStepsPackDone })) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /quests 1 of 5/ })
    await expect(trigger).toHaveAttribute('data-progress', '20')
    /* the pack is claimed: no dot */
    await expect(trigger.querySelector('[data-slot="quest-claim-dot"]')).toBeNull()
    await expect(canvas.getByRole('link', { name: /Mint/ })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByText('Done.')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /show all quests/i })).toBeNull()
    const done = questStepsPackDone.filter((step) => step.done).length
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(done))
  },
}

/** The one-shot claim in flight: disabled and busy, so a second press does nothing. */
export const Opening: Story = {
  args: { model: open(buildQuestBarModel({ ...fresh, busy: true })) },
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

/** A one-shot claim that fails silently is the worst state this panel can be in. */
export const ClaimFailed: Story = {
  args: {
    model: open(buildQuestBarModel({ ...fresh, claimError: "Pack didn't open — tap to try again." })),
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
  args: { model: open(buildQuestBarModel({ ...fresh, steps: questStepsPackDone })) },
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
      balance={balance}
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

/** No ladder: the pill is the plain balance — a raised span, no ring, no button. */
export const Hidden: Story = {
  args: { model: buildQuestBarModel({ ...fresh, steps: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).toBeNull()
    const pill = canvas.getByText(`${meLou.coins.toLocaleString()} braincells`).parentElement!
    await expect(pill).toHaveAttribute('data-slot', 'coins')
    await expect(pill.tagName).toBe('SPAN')
  },
}

/** The same plain pill the shell renders once every quest is done, or before the ladder loads. */
export const Balance: Story = {
  args: { model: null },
}

export const Dark: Story = { ...Expanded, globals: { theme: 'dark' } }
