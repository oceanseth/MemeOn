import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { paperMeme, questStepsFresh, questStepsPackDone, silverMeme } from '../../.storybook/fixtures'
import { buildQuestBarModel } from '../lib/questBarModel'
import { QuestBar } from './QuestBar'

const onClaimPack = fn()
const onDismissPack = fn()
const fresh = {
  steps: questStepsFresh,
  packMemes: null,
  packReward: 0,
  busy: false,
  onClaimPack,
  onDismissPack,
}

const meta = {
  title: 'Molecules/QuestBar',
  component: QuestBar,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: { model: buildQuestBarModel(fresh) },
} satisfies Meta<typeof QuestBar>

export default meta
type Story = StoryObj<typeof meta>

export const Fresh: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/your braincells/)).toHaveTextContent('0/5')
    await userEvent.click(canvas.getByRole('button', { name: /starter pack/i }))
    await expect(onClaimPack).toHaveBeenCalledTimes(1)
    await expect(canvas.getByRole('link', { name: /Mint/ })).toHaveAttribute('href', '/binder/new')
  },
}

export const Opening: Story = {
  args: { model: buildQuestBarModel({ ...fresh, busy: true }) },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Opening/ })
    await expect(trigger).toBeDisabled()
    await userEvent.click(trigger)
    await expect(onClaimPack).not.toHaveBeenCalled()
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
    const modal = canvas.getByRole('dialog', { name: 'Starter pack opened' })
    await userEvent.click(within(modal).getByRole('heading', { name: /Starter pack opened/ }))
    await expect(onDismissPack).not.toHaveBeenCalled()
    const cardLink = within(modal).getByRole('link', { name: new RegExp(paperMeme.title) })
    await expect(cardLink).toHaveAttribute('href', `/m/${paperMeme.id}`)

    await userEvent.click(modal.parentElement!)
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
    onDismissPack.mockClear()
    await userEvent.click(canvas.getByRole('button', { name: 'Keep exploring' }))
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
    onDismissPack.mockClear()
    await expect(canvas.getByRole('link', { name: 'View in My Binder' })).toHaveAttribute('href', '/binder')
    await userEvent.click(canvas.getByRole('button', { name: 'View in My Binder' }))
    await expect(onDismissPack).toHaveBeenCalledTimes(1)
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
