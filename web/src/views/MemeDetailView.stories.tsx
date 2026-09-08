import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { listedHolo } from '../../.storybook/fixtures'
import { MemeDetailView } from './MemeDetailView'

const meta = {
  title: 'Views/MemeDetailView',
  component: MemeDetailView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`/m/${listedHolo.id}`]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MemeDetailView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
