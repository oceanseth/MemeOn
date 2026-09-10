import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { FaqItem } from './FaqItem'

const ANSWER = 'A meme trading card market. You mint memes, and they climb the tiers.'

const meta = {
  title: 'Molecules/FaqItem',
  component: FaqItem,
  args: {
    question: 'WTF is MemeOn?',
    children: <p>{ANSWER}</p>,
  },
} satisfies Meta<typeof FaqItem>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'WTF is MemeOn?' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText(ANSWER)).not.toBeInTheDocument()
  },
}

export const OpenByDefault: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'WTF is MemeOn?' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(canvas.getByText(ANSWER)).toBeInTheDocument()
  },
}

/** The trigger toggles the panel, flips `aria-expanded`, and the marker rotates via its own state. */
export const TogglesOpenAndClosed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'WTF is MemeOn?' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(await canvas.findByText(ANSWER)).toBeInTheDocument()

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(canvas.queryByText(ANSWER)).not.toBeInTheDocument())
  },
}
