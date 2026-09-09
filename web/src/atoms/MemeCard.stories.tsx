import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { holoMeme, listedHolo, paperMeme, silverMeme } from '../../.storybook/fixtures'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { MemeCard } from './MemeCard'

const meta = {
  title: 'Atoms/MemeCard',
  component: MemeCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 280 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MemeCard>

export default meta
type Story = StoryObj<typeof meta>

export const Paper: Story = {
  args: { model: buildMemeCardModel(paperMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link')).toHaveAttribute('href', '/m/meme-paper')
    await expect(canvas.getByRole('img', { name: paperMeme.title })).toHaveAttribute(
      'src',
      paperMeme.imageUrl,
    )
  },
}
export const Silver: Story = { args: { model: buildMemeCardModel(silverMeme) } }
export const Holo: Story = { args: { model: buildMemeCardModel(holoMeme) } }
export const Listed: Story = { args: { model: buildMemeCardModel(listedHolo) } }
