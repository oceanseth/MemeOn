import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { landingCopy as copy } from '../copy/landing'
import { buildLandingFaqItems } from '../hooks/useLandingScreen'
import { LandingFaq } from '@/organisms/landing-faq'

const faqItems = buildLandingFaqItems()

const meta = {
  title: 'Organisms/LandingFaq',
  component: LandingFaq,
  args: {
    faqTitle: copy.faq.title,
    faqItems,
  },
} satisfies Meta<typeof LandingFaq>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="landing-faq"]')).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll('[data-slot="faq-item"]')).toHaveLength(faqItems.length)
  },
}

export const Dark: Story = { ...Ready, globals: { theme: 'dark' } }
