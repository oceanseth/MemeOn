import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InviteView } from './InviteView'

const meta = {
  title: 'Views/InviteView',
  component: InviteView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/invite/user-pal']}>
        <Routes>
          <Route path="/invite/:sub" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof InviteView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
