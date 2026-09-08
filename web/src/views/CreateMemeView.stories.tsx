import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { CreateMemeView } from './CreateMemeView'

const meta = {
  title: 'Views/CreateMemeView',
  component: CreateMemeView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/binder/new']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof CreateMemeView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
