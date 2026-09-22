import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ToggleGroup, ToggleGroupItem } from '@/atoms/toggle-group'
import { Icon } from '@/atoms/icon'

const onValueChange = fn()

const meta = {
  title: 'Atoms/ToggleGroup',
  component: ToggleGroup,
  args: { 'aria-label': 'Sort by', onValueChange },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

type SortKey = 'newest' | 'views' | 'ranking'

/** The SortChips row: single-select, so re-pressing the selected chip empties the group. */
function SortChips() {
  const [selected, setSelected] = useState<SortKey[]>(['newest'])
  return (
    <ToggleGroup<SortKey>
      aria-label="Sort by"
      size="chip"
      value={selected}
      onValueChange={(next) => {
        onValueChange(next)
        setSelected(next)
      }}
    >
      <ToggleGroupItem<SortKey> value="newest">Newest</ToggleGroupItem>
      <ToggleGroupItem<SortKey> value="views">Views</ToggleGroupItem>
      <ToggleGroupItem<SortKey> value="ranking">Ranking</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Chips: Story = {
  render: () => <SortChips />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const group = canvas.getByRole('group', { name: 'Sort by' })
    await expect(group).toHaveAttribute('data-slot', 'toggle-group')
    await expect(group).toHaveAttribute('data-size', 'chip')
    const newest = canvas.getByRole('button', { name: 'Newest', pressed: true })
    await expect(newest).toHaveAttribute('data-slot', 'toggle-group-item')
    await expect(newest).toHaveAttribute('data-size', 'chip')
    await expect(newest.offsetHeight).toBe(46)
    await userEvent.click(canvas.getByRole('button', { name: 'Views' }))
    await expect(onValueChange).toHaveBeenLastCalledWith(['views'])
    await expect(canvas.getByRole('button', { name: 'Views' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Newest' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    // the flip gesture: pressing the selected chip again reports an empty group
    await userEvent.click(canvas.getByRole('button', { name: 'Views' }))
    await expect(onValueChange).toHaveBeenLastCalledWith([])
  },
}

/** The ThemeControl well: 34px segments inside a 42px pressed well; the pressed one is raised. */
export const Segmented: Story = {
  args: {
    'aria-label': 'Theme',
    variant: 'segment',
    size: 'sm',
    defaultValue: ['auto'],
    className: 'w-56',
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="auto">
        <span aria-hidden="true">
          <Icon name="contrast" size={16} />
        </span>{' '}
        Auto
      </ToggleGroupItem>
      <ToggleGroupItem value="light">
        <span aria-hidden="true">
          <Icon name="sun" size={16} />
        </span>{' '}
        Light
      </ToggleGroupItem>
      <ToggleGroupItem value="dark">
        <span aria-hidden="true">
          <Icon name="moon" size={16} />
        </span>{' '}
        Dark
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const well = canvas.getByRole('group', { name: 'Theme' })
    await expect(well).toHaveAttribute('data-variant', 'segment')
    await expect(well.offsetHeight).toBe(42)
    await expect(well.offsetWidth).toBe(224)
    // the well is the pressed material
    await expect(getComputedStyle(well).boxShadow).toContain('inset')
    const auto = canvas.getByRole('button', { name: 'Auto', pressed: true })
    await expect(auto).toHaveAttribute('data-variant', 'segment')
    await expect(auto.offsetHeight).toBe(34)
    // the current segment is raised out of the well; the others are transparent
    await expect(getComputedStyle(auto).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    const light = canvas.getByRole('button', { name: 'Light', pressed: false })
    await expect(getComputedStyle(light).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await userEvent.click(light)
    await expect(light).toHaveAttribute('aria-pressed', 'true')
    await expect(auto).toHaveAttribute('aria-pressed', 'false')
  },
}

/** `multiple`: any number pressed at once. */
export const Multiple: Story = {
  args: {
    'aria-label': 'Media',
    multiple: true,
    defaultValue: ['image', 'video'],
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="image">Images</ToggleGroupItem>
      <ToggleGroupItem value="video">Videos</ToggleGroupItem>
      <ToggleGroupItem value="gif">GIFs</ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button', { pressed: true })).toHaveLength(2)
    await userEvent.click(canvas.getByRole('button', { name: 'GIFs' }))
    await expect(canvas.getAllByRole('button', { pressed: true })).toHaveLength(3)
  },
}

export const Vertical: Story = {
  args: {
    'aria-label': 'Sort by',
    orientation: 'vertical',
    defaultValue: ['newest'],
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
      <ToggleGroupItem value="views">Views</ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Sort by' })
    await expect(group).toHaveAttribute('data-orientation', 'vertical')
    await expect(getComputedStyle(group).flexDirection).toBe('column')
  },
}

export const Disabled: Story = {
  args: { 'aria-label': 'Sort by', disabled: true, defaultValue: ['newest'] },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
      <ToggleGroupItem value="views">Views</ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Views' })).toBeDisabled()
  },
}

export const Dark: Story = { ...Segmented, globals: { theme: 'dark' } }

/** An omitted group look is `default` and wins over an item that sets its own. */
export const DefaultsWin: Story = {
  args: {
    'aria-label': 'Look',
    defaultValue: ['one'],
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="one" variant="segment" size="sm">
        One
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = canvas.getByRole('group', { name: 'Look' })
    await expect(group).toHaveAttribute('data-variant', 'default')
    await expect(group).toHaveAttribute('data-size', 'default')
    const item = canvas.getByRole('button', { name: 'One' })
    await expect(item).toHaveAttribute('data-variant', 'default')
    await expect(item).toHaveAttribute('data-size', 'default')
  },
}
