import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { LandingFaq } from '@/organisms/landing-faq'
import { landingCopy as copy } from '../copy/landing'
import { buildLandingFaqItems } from '../hooks/useLandingScreen'

const meta = {
  title: 'Organisms/LandingFaq',
  component: LandingFaq,
  args: { faqTitle: copy.faq.title, faqItems: buildLandingFaqItems() },
} satisfies Meta<typeof LandingFaq>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2, name: copy.faq.title })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { level: 3, name: copy.faq.items[0].question })).toBeInTheDocument()
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(copy.faq.items.length)
  },
}
