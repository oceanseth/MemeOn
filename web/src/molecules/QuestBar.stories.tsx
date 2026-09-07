import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { paperMeme, questStepsFresh, questStepsPackDone, silverMeme } from '../../.storybook/fixtures'
import { QuestBar } from './QuestBar'

const meta = {
  title: 'Molecules/QuestBar',
  component: QuestBar,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: {
    steps: questStepsFresh,
    packMemes: null,
    packReward: 0,
    busy: false,
    onClaimPack: fn(),
    onDismissPack: fn(),
  },
} satisfies Meta<typeof QuestBar>

export default meta
type Story = StoryObj<typeof meta>

export const Fresh: Story = {}
export const Opening: Story = { args: { busy: true } }
export const PackDone: Story = { args: { steps: questStepsPackDone } }
export const PackOpened: Story = {
  args: {
    steps: questStepsPackDone,
    packMemes: [paperMeme, silverMeme],
    packReward: 20,
  },
}
export const EmptyVault: Story = {
  args: {
    steps: questStepsPackDone,
    packMemes: [],
    packReward: 20,
  },
}
