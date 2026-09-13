import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { heroVideoCopy as copy } from '../copy/heroVideo'
import { buildHeroVideoModel, type HeroVideoState } from '../lib/heroVideoModel'
import { HeroVideo } from './HeroVideo'

const handlers = { attachVideo: fn(), onStart: fn(), onToggleSound: fn() }

/** Both autoplay branches are model inputs, so each one is a story instead of an environment. */
const model = (state: Partial<Pick<HeroVideoState, 'autoplay' | 'muted' | 'started'>>) =>
  buildHeroVideoModel({
    autoplay: true,
    muted: true,
    started: false,
    ...handlers,
    ...state,
  })

const meta = {
  title: 'Molecules/HeroVideo',
  component: HeroVideo,
  args: { model: model({ autoplay: true }) },
  decorators: [(Story) => <div className="mx-auto max-w-hero-video p-5"><Story /></div>],
} satisfies Meta<typeof HeroVideo>

export default meta
type Story = StoryObj<typeof meta>

export const Autoplaying: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    handlers.onToggleSound.mockClear()
    const video = canvasElement.querySelector('video')
    await expect(video).toBeInTheDocument()
    await expect(video).toHaveAttribute('preload', 'metadata')
    await expect(video!.controls).toBe(false)
    await expect(canvas.queryByRole('button', { name: copy.play })).not.toBeInTheDocument()
    const sound = canvas.getByRole('button', { name: copy.unmute })
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(sound)
    await expect(handlers.onToggleSound).toHaveBeenCalledTimes(1)
  },
}

export const AutoplayingDark: Story = { ...Autoplaying, name: 'Autoplaying dark', globals: { theme: 'dark' } }

/** The visitor turned the sound on: the pill names the way back. */
export const SoundOn: Story = {
  args: { model: model({ autoplay: true, muted: false }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sound = canvas.getByRole('button', { name: copy.mute })
    await expect(sound).toHaveAttribute('aria-pressed', 'true')
    await expect(sound).toHaveTextContent(copy.soundOff)
  },
}

/**
 * What a reduced-motion preference, Data Saver or a 2g/3g connection gets: nothing downloads,
 * the branded poster keeps the frame, and a pill starts the film — never the UA's control bar.
 */
export const PosterWithPlayPill: Story = {
  args: { model: model({ autoplay: false }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    handlers.onStart.mockClear()
    const video = canvasElement.querySelector('video')
    await expect(video).toHaveAttribute('preload', 'none')
    await expect(video).toHaveAttribute('poster', '/promo/memeon-promo-poster.jpg')
    await expect(video!.controls).toBe(false)
    await expect(video!.autoplay).toBe(false)
    await expect(canvas.queryByRole('button', { name: /the video$/ })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: copy.play }))
    await expect(handlers.onStart).toHaveBeenCalledTimes(1)
  },
}

/** After the visitor pressed play in the withheld branch: the pill is gone, the sound toggle is in. */
export const StartedByHand: Story = {
  args: { model: model({ autoplay: false, started: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: copy.play })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: copy.unmute })).toBeInTheDocument()
  },
}
