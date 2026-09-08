import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { BinderView } from './BinderView'

const meta = {
  title: 'Views/BinderView',
  component: BinderView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/binder/user-lou']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof BinderView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
