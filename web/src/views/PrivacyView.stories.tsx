import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { PrivacyView } from './PrivacyView'

const meta = {
  title: 'Views/PrivacyView',
  component: PrivacyView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/privacy']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof PrivacyView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
