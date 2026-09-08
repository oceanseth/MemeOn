import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { DiscordPageView } from './DiscordPageView'

const meta = {
  title: 'Views/DiscordPageView',
  component: DiscordPageView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/discord']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DiscordPageView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
