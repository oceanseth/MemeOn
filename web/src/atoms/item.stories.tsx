import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Link } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { Avatar } from '@/atoms/avatar'
import { Button } from '@/atoms/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/atoms/item'

const meta = {
  title: 'Atoms/Item',
  component: Item,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-105 p-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

/** A person row: avatar, name over meta, an action at the end; 44px of target. */
export const Default: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="image">
        <Avatar name="Lou" size="md" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Lou</ItemTitle>
        <ItemDescription>12 memes · online</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button>Add friend</Button>
      </ItemActions>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector<HTMLElement>('[data-slot="item"]')!
    await expect(item).not.toBeNull()
    await expect(item).toHaveAttribute('data-variant', 'default')
    await expect(item).toHaveAttribute('data-size', 'default')
    await expect(item.offsetHeight).toBeGreaterThanOrEqual(44)
    for (const slot of ['item-media', 'item-content', 'item-title', 'item-description', 'item-actions']) {
      await expect(canvasElement.querySelector(`[data-slot="${slot}"]`)).not.toBeNull()
    }
    // the media steps up to align with the title when a description follows it
    const media = canvasElement.querySelector<HTMLElement>('[data-slot="item-media"]')!
    await expect(getComputedStyle(media).alignSelf).toBe('flex-start')
  },
}

/** The three fills and the compact size. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline</ItemTitle>
          <ItemDescription>A hairline in the border colour.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted</ItemTitle>
          <ItemDescription>The flat well a person row sits in on the detail page.</ItemDescription>
        </ItemContent>
      </Item>
      <Item size="sm">
        <ItemMedia variant="icon" aria-hidden="true">
          🔔
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Small</ItemTitle>
        </ItemContent>
      </Item>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll<HTMLElement>('[data-slot="item"]')
    await expect(items).toHaveLength(3)
    await expect(items[0]).toHaveAttribute('data-variant', 'outline')
    await expect(getComputedStyle(items[0]!).borderTopWidth).toBe('1px')
    await expect(items[1]).toHaveAttribute('data-variant', 'muted')
    await expect(getComputedStyle(items[1]!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    await expect(items[2]).toHaveAttribute('data-size', 'sm')
  },
}

/** A stack with hairlines between rows. */
export const Grouped: Story = {
  render: () => (
    <ItemGroup>
      <Item>
        <ItemContent>
          <ItemTitle>First</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>Second</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>Third</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="item-group"]')).not.toBeNull()
    await expect(canvasElement.querySelectorAll('[data-slot="item-separator"]')).toHaveLength(2)
    await expect(canvasElement.querySelectorAll('[data-slot="item"]')).toHaveLength(3)
  },
}

/** The row is the link: `render` swaps the div for a router Link and the hover tint comes on. */
export const AsRouterLink: Story = {
  render: () => (
    <Item render={<Link to="/u/lou" />}>
      <ItemMedia variant="image">
        <Avatar name="Lou" size="md" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Lou</ItemTitle>
        <ItemDescription>Open the profile</ItemDescription>
      </ItemContent>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: /Lou/ })
    await expect(link).toHaveAttribute('href', '/u/lou')
    await expect(link).toHaveAttribute('data-slot', 'item')
    await expect(getComputedStyle(link).cursor).toBe('pointer')
  },
}

/** A long name in a fixed-width row: `truncate` clips it to one line. */
export const TruncatedTitle: Story = {
  render: () => (
    <div className="w-60">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle truncate>Someone with an extraordinarily long display name</ItemTitle>
          <ItemDescription>3 memes</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="item-title"]')!
    await expect(getComputedStyle(title).textOverflow).toBe('ellipsis')
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth)
  },
}

/** Header and footer span the full row above and below the media/content line. */
export const WithHeaderAndFooter: Story = {
  render: () => (
    <Item variant="outline">
      <ItemHeader>
        <span className="text-sm text-muted-foreground">Trade #42</span>
        <span className="text-sm text-muted-foreground">2 days ago</span>
      </ItemHeader>
      <ItemContent>
        <ItemTitle>Lou offers 3 shares</ItemTitle>
        <ItemDescription>for your Holo card</ItemDescription>
      </ItemContent>
      <ItemFooter>
        <Button>Decline</Button>
        <Button variant="primary">Accept</Button>
      </ItemFooter>
    </Item>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="item-header"]')).not.toBeNull()
    await expect(canvasElement.querySelector('[data-slot="item-footer"]')).not.toBeNull()
  },
}

export const Dark: Story = { ...Variants, globals: { theme: 'dark' } }
