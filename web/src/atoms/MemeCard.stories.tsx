import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { holoMeme, listedHolo, paperMeme, silverMeme } from '../../.storybook/fixtures'
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

export const Paper: Story = { args: { meme: paperMeme } }
export const Silver: Story = { args: { meme: silverMeme } }
export const Holo: Story = { args: { meme: holoMeme } }
export const Listed: Story = { args: { meme: listedHolo } }
