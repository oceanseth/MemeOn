import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { ProfileView } from './ProfileView'

const meta = {
  title: 'Views/ProfileView',
  component: ProfileView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/u/user-lou']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProfileView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const BinderTab: Story = { args: { initialTab: 'binder' } }
