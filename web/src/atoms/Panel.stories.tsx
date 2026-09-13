import type { Meta, StoryObj } from '@storybook/react-vite'
import { Panel, PanelHeading } from './Panel'

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

/**
 * Role sizes. A bare heading takes `Panel`'s intro; `PanelHeading` opts out of that descendant
 * rule so mint cards can take card-title and the trade composer can take title.
 */
export const HeadingSizes: Story = {
  args: {
    children: (
      <>
        <PanelHeading>Panel default — intro</PanelHeading>
        <PanelHeading size="section">Section card — intro</PanelHeading>
        <PanelHeading size="hero">Market hero card — card-heading</PanelHeading>
        <PanelHeading size="card">Mint card — card-title</PanelHeading>
        <PanelHeading size="composer">Trade composer — title</PanelHeading>
        <h3>Bare h3 — still intro</h3>
      </>
    ),
  },
}

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
