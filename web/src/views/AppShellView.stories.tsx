import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { AppShellView } from './AppShellView'

const meta = {
  title: 'Views/AppShellView',
  component: AppShellView,
  tags: ['!autodocs'],
  args: {
    children: <main className="container"><p>page body</p></main>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppShellView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
