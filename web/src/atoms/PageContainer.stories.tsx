import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
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

/** Every real screen wants the `<main id="main" tabIndex={-1}>` landmark to be this element itself. */
export const AsMain: Story = {
  args: { as: 'main', id: 'main', tabIndex: -1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const main = canvas.getByRole('main')
    await expect(main).toHaveAttribute('id', 'main')
    await expect(main).toHaveAttribute('tabindex', '-1')
  },
}

export const Dark: Story = { ...AsMain, globals: { theme: 'dark' } }
