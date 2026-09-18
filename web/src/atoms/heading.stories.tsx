import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Heading } from '@/atoms/heading'

/** A token as `:root` declares it, so the assertion follows the scale rather than pinning a literal. */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const meta = {
  title: 'Atoms/Heading',
  component: Heading,
  args: { children: 'Top Brains' },
} satisfies Meta<typeof Heading>

export default meta
type Story = StoryObj<typeof meta>

/** The default: an `<h2>` at the title step. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2, name: 'Top Brains' })
    await expect(heading).toHaveAttribute('data-slot', 'heading')
    await expect(heading).toHaveAttribute('data-size', 'title')
    await expect(getComputedStyle(heading).fontSize).toBe(token('--text-3xl'))
    await expect(getComputedStyle(heading).fontFamily).toContain('Unbounded')
    await expect(getComputedStyle(heading).marginBottom).toBe('0px')
  },
}

/** The five sizes; each reads its step straight from the ladder. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <Heading size="display">Display</Heading>
      <Heading size="section">Section</Heading>
      <Heading size="title">Title</Heading>
      <Heading size="card-title">Card title</Heading>
      <Heading size="card-title-phone">Card title, phone</Heading>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const steps = [
      ['Display', '--text-5xl'],
      ['Section', '--text-4xl'],
      ['Title', '--text-3xl'],
      ['Card title', '--text-2xl'],
      ['Card title, phone', '--text-lg'],
    ] as const
    for (const [name, step] of steps) {
      const heading = canvas.getByRole('heading', { name })
      await expect(getComputedStyle(heading).fontSize).toBe(token(step))
    }
    await expect(canvasElement.querySelectorAll('[data-slot="heading"]')).toHaveLength(5)
  },
}

/** The element is the outline level; the size is the look — independent of each other. */
export const Levels: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <Heading as="h1" size="title">
        An h1 at the title step
      </Heading>
      <Heading as="h2" size="display">
        An h2 at the display step
      </Heading>
      <Heading as="h3" size="card-title-phone">
        An h3 at the phone card-title step
      </Heading>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const h1 = canvas.getByRole('heading', { level: 1 })
    await expect(getComputedStyle(h1).fontSize).toBe(token('--text-3xl'))
    const h2 = canvas.getByRole('heading', { level: 2 })
    await expect(getComputedStyle(h2).fontSize).toBe(token('--text-5xl'))
    await expect(canvas.getByRole('heading', { level: 3 })).toHaveAttribute('data-size', 'card-title-phone')
  },
}

/** `title-phone` keeps a trailing live count on the title's line under the 641 cut. */
export const TitlePhone: Story = {
  args: { size: 'title-phone', children: 'Fresh drops · 128' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="heading"]')).toHaveAttribute('data-size', 'title-phone')
  },
}

export const Dark: Story = { ...Sizes, globals: { theme: 'dark' } }
