import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton, SkeletonBlock, SkeletonCard, SkeletonRow } from './Skeleton'

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = { args: { style: { width: 120, height: 40 } } }

/** Reserves the same 340px a `.card-slot` reserves at any track width. */
export const Card: Story = { render: () => <SkeletonCard style={{ width: 170 }} /> }
export const Row: Story = { render: () => <SkeletonRow style={{ width: 320 }} /> }
export const Block: Story = { render: () => <SkeletonBlock style={{ width: 180 }} /> }
