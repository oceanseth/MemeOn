import type { Meta, StoryObj } from '@storybook/react-vite'
import { QuestBar } from './QuestBar'
import { LADDER, QUESTS, art } from './fixtures'

const meta = {
  title: 'Chrome/QuestBar',
  component: QuestBar,
  parameters: {
    docs: {
      description: {
        component:
          'Onboarding quest strip shown under the header until every quest is done. Pass `steps={[]}` to render nothing.',
      },
    },
  },
} satisfies Meta<typeof QuestBar>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}
// The app serves this from /api/brand; stories stay offline.
const brand = art('#ff9af5', '#7fd4ff', '🧠')
const base = { brandImageSrc: brand, onClaimPack: noop, onDismissPack: noop }

/** A fresh account: the starter pack is claimable, most quests undone. */
export const FreshAccount: Story = {
  args: { ...base, steps: QUESTS },
}

/** Mid-onboarding: the pack is claimed, progress count advances. */
export const InProgress: Story = {
  args: {
    ...base,
    steps: QUESTS.map((s) => (['pack', 'mint'].includes(s.key) ? { ...s, done: true } : s)),
  },
}

/** Claiming: the pack button reports its in-flight state. */
export const ClaimingPack: Story = {
  args: { ...base, steps: QUESTS, busy: true },
}

/** The reward modal after opening the starter pack. */
export const PackOpened: Story = {
  args: {
    ...base,
    steps: QUESTS.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)),
    packResult: { memes: LADDER.slice(0, 4), reward: 500 },
  },
}

/** An empty vault still pays out braincells. */
export const EmptyPack: Story = {
  args: {
    ...base,
    steps: QUESTS.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)),
    packResult: { memes: [], reward: 500 },
  },
}
