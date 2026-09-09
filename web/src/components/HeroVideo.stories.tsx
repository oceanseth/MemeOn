import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import HeroVideo from './HeroVideo'

/** Both autoplay branches are now props, so each one is a story instead of an environment. */
const meta = {
  title: 'Components/HeroVideo',
  component: HeroVideo,
} satisfies Meta<typeof HeroVideo>

export default meta
type Story = StoryObj<typeof meta>

export const Autoplaying: Story = {
  args: { autoplay: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const video = canvasElement.querySelector('video')
    await expect(video).toBeInTheDocument()
    await expect(video).toHaveAttribute('preload', 'metadata')
    await expect(video!.controls).toBe(false)
    await expect(canvas.getByRole('button', { name: 'Unmute the video' })).toBeInTheDocument()
  },
}

/**
 * What a reduced-motion preference, Data Saver or a 2g/3g connection gets: nothing downloads,
 * the branded poster keeps the frame, and a pill starts the film — never the UA's control bar.
 */
export const PosterWithPlayPill: Story = {
  args: { autoplay: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const video = canvasElement.querySelector('video')
    await expect(video).toHaveAttribute('preload', 'none')
    await expect(video).toHaveAttribute('poster', '/promo/memeon-promo-poster.jpg')
    await expect(video!.controls).toBe(false)
    await expect(video!.autoplay).toBe(false)
    await expect(canvas.queryByRole('button', { name: /the video$/ })).not.toBeInTheDocument()

    const play = canvas.getByRole('button', { name: 'Play the 50-second tour' })
    await userEvent.click(play)
    await expect(play).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Unmute the video' })).toBeInTheDocument()
  },
}
