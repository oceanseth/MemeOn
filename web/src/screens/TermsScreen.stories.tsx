import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { TermsScreen } from './TermsScreen'

const meta = {
  title: 'Screens/TermsScreen',
  component: TermsScreen,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof TermsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
