import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SortChips, type SortDir, type SortKey } from './SortChips'

const meta = {
  title: 'Controls/SortChips',
  component: SortChips,
  parameters: {
    docs: {
      description: {
        component:
          'Click a stat to sort by it; click again to flip direction. The active chip carries the ↓ / ↑ indicator.',
      },
    },
  },
} satisfies Meta<typeof SortChips>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}

/** Default feed sort: newest first. */
export const Default: Story = {
  args: { sortKey: 'new', dir: 'desc', onChange: noop },
}

/** The active treatment follows whichever stat is selected. */
export const SortedByValue: Story = {
  args: { sortKey: 'value', dir: 'desc', onChange: noop },
}

/** Ascending flips the indicator. */
export const Ascending: Story = {
  args: { sortKey: 'views', dir: 'asc', onChange: noop },
}

/** Every key active in turn, so idle-vs-active reads across the set. */
export const AllKeys: Story = {
  args: { sortKey: 'new', dir: 'desc', onChange: noop },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SortChips sortKey="new" dir="desc" onChange={noop} />
      <SortChips sortKey="views" dir="desc" onChange={noop} />
      <SortChips sortKey="reshares" dir="desc" onChange={noop} />
      <SortChips sortKey="value" dir="asc" onChange={noop} />
    </div>
  ),
}

/** Live: clicking a chip sorts, clicking again flips direction. */
export const Interactive: Story = {
  args: { sortKey: 'new', dir: 'desc', onChange: noop },
  render: function Render() {
    const [key, setKey] = useState<SortKey>('new')
    const [dir, setDir] = useState<SortDir>('desc')
    return (
      <SortChips
        sortKey={key}
        dir={dir}
        onChange={(k, d) => {
          setKey(k)
          setDir(d)
        }}
      />
    )
  },
}
