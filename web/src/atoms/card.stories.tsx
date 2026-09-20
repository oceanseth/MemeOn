import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from '@/atoms/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/atoms/card'

/** A token as `:root` declares it, so the assertion follows the scale rather than pinning a literal. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const meta = {
  title: 'Atoms/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: (
      <>
        <CardTitle>Trade details</CardTitle>
        <CardDescription>Two Bronze memes for one Gold.</CardDescription>
        <CardContent>
          <p>The offer stands until either side withdraws it.</p>
        </CardContent>
      </>
    ),
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** The raised card at the card inset; a title is an `<h2>` at the intro step unless told otherwise. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!
    await expect(card).toHaveAttribute('data-size', 'default')
    await expect(getComputedStyle(card).borderRadius).toBe(token('--radius-lg'))
    await expect(getComputedStyle(card).paddingTop).toBe('24px')
    const title = canvas.getByRole('heading', {
      level: 2,
      name: 'Trade details',
    })
    await expect(title).toHaveAttribute('data-slot', 'card-title')
    await expect(title).toHaveAttribute('data-size', 'intro')
    await expect(canvasElement.querySelector('[data-slot="card-description"]')).toHaveTextContent(
      'Two Bronze memes for one Gold.',
    )
  },
}

/** The registry header: title and description stack on the left, the action sits to the right. */
export const WithAction: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle size="card-title">Open trades</CardTitle>
          <CardDescription>Three waiting on you.</CardDescription>
          <CardAction>
            <Button size="sm">See all</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Offers you have not answered yet.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary">Propose a trade</Button>
          <Button>Later</Button>
        </CardFooter>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="card-header"]')!
    await expect(getComputedStyle(header).display).toBe('grid')
    const action = canvas
      .getByRole('button', { name: 'See all' })
      .closest('[data-slot="card-action"]')!
    const title = canvas.getByRole('heading', { name: 'Open trades' })
    // the action shares the header row with the title, to its right
    await expect(action.getBoundingClientRect().left).toBeGreaterThan(
      title.getBoundingClientRect().right,
    )
    await expect(canvasElement.querySelector('[data-slot="card-footer"]')).not.toBeNull()
  },
}

/** The three insets: card (24/18), the tighter 20, and the 20×16 row. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <CardTitle>Default inset</CardTitle>
      </Card>
      <Card size="sm">
        <CardTitle>Small inset</CardTitle>
      </Card>
      <Card size="xs">
        <CardTitle>Row inset</CardTitle>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = canvasElement.querySelectorAll<HTMLElement>('[data-slot="card"]')
    await expect(cards).toHaveLength(3)
    await expect(Array.from(cards, (card) => getComputedStyle(card).paddingTop)).toEqual([
      '24px',
      '20px',
      '16px',
    ])
  },
}

/** Default surface, the accent band, and the highlighted card with the primary ring inside its edge. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <CardTitle>Surface</CardTitle>
      </Card>
      <Card variant="accent">
        <CardTitle>Accent band</CardTitle>
      </Card>
      <Card variant="highlighted">
        <CardTitle>Fresh key</CardTitle>
        <CardDescription>Copy it now; it is shown once.</CardDescription>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = canvasElement.querySelectorAll<HTMLElement>('[data-slot="card"]')
    await expect(getComputedStyle(cards[2]!).boxShadow).toContain('inset')
  },
}

/** The heading steps, and `render` for the level the outline wants. */
export const TitleSizes: Story = {
  args: {
    children: (
      <>
        <CardTitle>Intro — the panel default</CardTitle>
        <CardTitle size="card-title">Card title — a mint or market card</CardTitle>
        <CardTitle size="title">Title — the trade composer</CardTitle>
        <CardTitle render={<h3 />}>An h3 at the intro step</CardTitle>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(3)
    const h3 = canvas.getByRole('heading', { level: 3 })
    await expect(h3).toHaveAttribute('data-slot', 'card-title')
    await expect(getComputedStyle(h3).fontSize).toBe(token('--text-lg'))
    await expect(getComputedStyle(canvas.getByText(/^Title — /)).fontSize).toBe(token('--text-3xl'))
  },
}

/** A well rather than a plate: the rail a quest bar sits in. */
export const Pressed: Story = {
  render: () => (
    <Card variant="pressed" size="sm">
      <CardTitle>Earn your braincells</CardTitle>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="card"]')).toHaveAttribute(
      'data-size',
      'sm',
    )
  },
}

export const Dark: Story = { ...WithAction, globals: { theme: 'dark' } }
