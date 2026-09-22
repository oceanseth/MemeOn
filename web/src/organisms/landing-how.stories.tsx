import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { landingCopy as copy } from '../copy/landing'
import { buildLandingHowSteps } from '../hooks/useLandingScreen'
import { LandingHow } from '@/organisms/landing-how'

const meta = {
  title: 'Organisms/LandingHow',
  component: LandingHow,
  args: {
    howTitle: copy.how.title,
    howSteps: buildLandingHowSteps(),
  },
} satisfies Meta<typeof LandingHow>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const how = canvasElement.querySelector<HTMLElement>('[data-slot="landing-how"]')!
    await expect(how).toBeInTheDocument()
    await expect(within(how).getAllByRole('listitem')).toHaveLength(3)
    await expect(
      within(how).getByRole('heading', {
        level: 3,
        name: copy.how.steps[0].title,
      }),
    ).toBeInTheDocument()
  },
}

export const Dark: Story = { ...Ready, globals: { theme: 'dark' } }
