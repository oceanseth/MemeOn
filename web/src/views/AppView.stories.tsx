import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { AppView } from './AppView'

const meta = {
  title: 'Views/AppView',
  component: AppView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
