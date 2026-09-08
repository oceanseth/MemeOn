import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { TermsView } from './TermsView'

const meta = {
  title: 'Views/TermsView',
  component: TermsView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/terms']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TermsView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
