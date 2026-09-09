import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageContainer } from './PageContainer'

const meta = {
  title: 'Atoms/PageContainer',
  component: PageContainer,
  args: { children: <p>Page content goes here.</p> },
} satisfies Meta<typeof PageContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Narrow: Story = { args: { narrow: true } }
