import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { MarketplaceView } from './MarketplaceView'

const meta = {
  title: 'Views/MarketplaceView',
  component: MarketplaceView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/marketplace']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MarketplaceView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
