import type { Meta, StoryObj } from '@storybook/react-vite'
import { Panel } from './Panel'

const meta = {
  title: 'Atoms/Panel',
  component: Panel,
  args: {
    children: (
      <>
        <h3>Trade details</h3>
        <p>Two Bronze memes for one Gold.</p>
      </>
    ),
  },
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `.trade-side h4` and similar still win at their own specificity; this is just the drop-in default. */
export const WithH4: Story = {
  args: {
    children: (
      <>
        <h4>Compact heading</h4>
        <p>Same treatment as h3.</p>
      </>
    ),
  },
}

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
