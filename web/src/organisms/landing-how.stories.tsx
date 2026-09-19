import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { LandingHow } from '@/organisms/landing-how'
import { landingCopy as copy } from '../copy/landing'
import { buildLandingHowSteps } from '../hooks/useLandingScreen'

const meta = {
  title: 'Organisms/LandingHow',
  component: LandingHow,
  args: { howTitle: copy.how.title, howSteps: buildLandingHowSteps() },
} satisfies Meta<typeof LandingHow>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const how = within(canvasElement.querySelector<HTMLElement>('[data-slot="landing-how"]')!)
    await expect(how.getAllByRole('listitem')).toHaveLength(3)
    await expect(how.getByRole('heading', { level: 3, name: copy.how.steps[0].title })).toBeInTheDocument()
  },
}
