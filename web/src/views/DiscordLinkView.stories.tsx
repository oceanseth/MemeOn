import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { DiscordLinkView } from './DiscordLinkView'

const meta = {
  title: 'Views/DiscordLinkView',
  component: DiscordLinkView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/discord/link']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DiscordLinkView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
