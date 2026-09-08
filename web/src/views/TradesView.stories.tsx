import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { TradesView } from './TradesView'

const meta = {
  title: 'Views/TradesView',
  component: TradesView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/trade']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TradesView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
