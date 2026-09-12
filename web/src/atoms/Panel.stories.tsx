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
 * The four board steps. A bare heading takes `Panel`'s own 17/21; `PanelHeading` opts out of that
 * rule, so a card whose board draws 18/22, 22/28 or 24/30 gets it without an `!` or a `[&_h3]` hack.
 */
export const HeadingSizes: Story = {
  args: {
    children: (
      <>
        <PanelHeading>Panel default — 17/21</PanelHeading>
        <PanelHeading size="section">Section card — 18/22</PanelHeading>
        <PanelHeading size="card">Mint card — 22/28</PanelHeading>
        <PanelHeading size="composer">Trade composer — 24/30</PanelHeading>
        <h3>Bare h3 — still 17/21</h3>
      </>
    ),
  },
}

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
