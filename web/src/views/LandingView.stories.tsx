import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { LandingView } from './LandingView'

const meta = {
  title: 'Views/LandingView',
  component: LandingView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LandingView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
