import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { Avatar } from './Avatar'

const LOGO = '/brand/memeon-logo-circle-64.png'
/* the first fetch of the logo on a cold test shard outruns testing-library's 1 s default */
const IMAGE_LOAD = { timeout: 8000 }

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  args: { name: 'lou' },
  decorators: [
    (Story) => (
      <div style={{ padding: 8 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

/** No picture is the common case: the disc is filled with the monogram, never left as a hole. */
export const Fallback: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('L')).toBeVisible()
    await expect(canvas.getByText('L').closest('[data-slot="avatar"]')).not.toBeNull()
  },
}

export const WithImage: Story = {
  args: { src: LOGO, alt: 'lou' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = await waitFor(() => canvas.getByRole('img', { name: 'lou' }), IMAGE_LOAD)
    await expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
    await waitFor(() => expect(canvas.queryByText('L')).toBeNull())
  },
}

/** A dead Google URL falls back to the monogram instead of a torn-image glyph. */
export const BrokenImage: Story = {
  args: { src: 'data:image/png;base64,notanimage' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('L')).toBeVisible())
  },
}

/** The 40px people-row disc, carrying the `loading="lazy"` the Friends and Leaderboard lists set. */
export const PersonRow: Story = {
  args: { size: 'md', src: LOGO, alt: 'lou', loading: 'lazy' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = await waitFor(() => canvas.getByRole('img', { name: 'lou' }), IMAGE_LOAD)
    await expect(image).toHaveAttribute('loading', 'lazy')
    await expect(image.closest('[data-slot="avatar"]')).toHaveClass('size-10')
  },
}

/** 34px phone header / account menu squircle. */
export const Header: Story = {
  args: { size: 'header' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvas.getByText('L').closest('[data-slot="avatar"]')!
    await expect(root).toHaveStyle({ width: '34px', height: '34px', borderRadius: '13px' })
  },
}

export const Large: Story = {
  args: { size: 'lg', src: LOGO, alt: 'lou' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByRole('img', { name: 'lou' })).toBeVisible(), IMAGE_LOAD)
  },
}

export const LargeFallback: Story = {
  args: { size: 'lg', name: 'Órla' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Ó')).toBeVisible()
  },
}

/** A blank display name still gets a disc, and the monogram says so. */
export const Nameless: Story = { args: { name: '  ' } }

export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar name="lou" src={LOGO} alt="" />
      <Avatar name="ada" />
      <Avatar name="9000" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('A')).toBeVisible()
    await expect(canvas.getByText('9')).toBeVisible()
  },
}

/** The four sizes, squircle and monogram on the ultraviolet fill. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name="lou" size="sm" />
      <Avatar name="oxfern" size="header" />
      <Avatar name="ada" size="md" />
      <Avatar name="CyberSeth" size="lg" />
    </div>
  ),
}

export const Dark: Story = { ...Sizes, globals: { theme: 'dark' } }
