import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { DevelopersView } from './DevelopersView'

const meta = {
  title: 'Views/DevelopersView',
  component: DevelopersView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/developers']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DevelopersView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
