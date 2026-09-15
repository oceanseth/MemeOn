import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Panel, PanelHeading } from '@/atoms/panel'

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

/** `Panel` is `Card` under its old name and slot; a bare h3 inside it still reads as intro. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const panel = canvasElement.querySelector('[data-slot="panel"]')
    await expect(panel).not.toBeNull()
    await expect(panel).toHaveAttribute('data-size', 'default')
    const heading = canvas.getByRole('heading', { level: 3 })
    await expect(getComputedStyle(heading).fontSize).toBe(
      getComputedStyle(document.documentElement).getPropertyValue('--text-intro').trim(),
    )
  },
}

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
 * Role sizes. A bare heading takes `Panel`'s intro; `PanelHeading` is `CardTitle` at the mapped
 * step and opts out of that descendant rule, so mint cards can take card-title and the trade
 * composer can take title.
 */
export const HeadingSizes: Story = {
  args: {
    children: (
      <>
        <PanelHeading>Panel default — intro</PanelHeading>
        <PanelHeading size="section">Section card — intro</PanelHeading>
        <PanelHeading size="hero">Market hero card — card-title</PanelHeading>
        <PanelHeading size="card">Mint card — card-title</PanelHeading>
        <PanelHeading size="composer" as="h3">
          Trade composer — title
        </PanelHeading>
        <h3>Bare h3 — still intro</h3>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelectorAll('[data-slot="card-title"]')).toHaveLength(5)
    const composer = canvas.getByRole('heading', { level: 3, name: 'Trade composer — title' })
    await expect(composer).toHaveAttribute('data-size', 'title')
  },
}

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
