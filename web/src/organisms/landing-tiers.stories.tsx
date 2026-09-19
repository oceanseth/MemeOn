import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { TIERS } from '@memeon/shared/tiers'
import { tierFrames } from '../../.storybook/fixtures'
import { LandingTiers } from '@/organisms/landing-tiers'
import { landingCopy as copy } from '../copy/landing'
import {
  buildLandingTierModels,
  type LandingFrameSlotState,
  type LandingScreenModel,
} from '../hooks/useLandingScreen'

const handlers = { onFrameError: fn() }

const slots = (state: LandingFrameSlotState): LandingScreenModel['frameSlotProps'] =>
  Object.fromEntries(
    TIERS.map((tier) => [
      tier.key,
      { 'data-state': state, style: { color: `var(--tier-${tier.key}-frame)` } },
    ]),
  )

const readyFrames: LandingScreenModel['frameImageProps'] = Object.fromEntries(
  TIERS.map((tier) => [
    tier.key,
    { src: tierFrames[tier.key], alt: '', loading: 'lazy', onError: handlers.onFrameError },
  ]),
)

const meta = {
  title: 'Organisms/LandingTiers',
  component: LandingTiers,
  args: {
    tiersTitle: copy.tiers.title,
    tiers: buildLandingTierModels(),
    frameImageProps: readyFrames,
    frameSlotProps: slots('ready'),
  },
} satisfies Meta<typeof LandingTiers>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const ladder = within(canvasElement.querySelector<HTMLElement>('[data-slot="landing-tiers"]')!)
    await expect(ladder.getAllByRole('listitem')).toHaveLength(TIERS.length)
    const last = buildLandingTierModels().at(-1)
    if (!last) throw new Error('expected last virality tier')
    await expect(ladder.getByRole('heading', { level: 3, name: last.name })).toBeInTheDocument()
  },
}
