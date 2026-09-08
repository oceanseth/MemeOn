import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { FriendsView } from './FriendsView'

const meta = {
  title: 'Views/FriendsView',
  component: FriendsView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/friends']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof FriendsView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
