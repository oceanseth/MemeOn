import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { PrivacyScreen } from './PrivacyScreen'

const meta = {
  title: 'Screens/PrivacyScreen',
  component: PrivacyScreen,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof PrivacyScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
