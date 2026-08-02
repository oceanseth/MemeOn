import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemeplexPanel } from './MemeplexPanel'
import { BINDER, LADDER, MEMEPLEX } from './fixtures'

const meta = {
  title: 'Panels/MemeplexPanel',
  component: MemeplexPanel,
  parameters: {
    docs: {
      description: {
        component:
          "A meme's family: remix ancestry, remixes of it, and manually linked relatives. Shareholders can link more.",
      },
    },
  },
} satisfies Meta<typeof MemeplexPanel>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}
const base = { meme: LADDER[2], onLink: noop }

/** Ancestry plus a family of remixes and related memes. */
export const FullFamily: Story = {
  args: { ...base, plex: MEMEPLEX, canEdit: false },
}

/** A shareholder gets the link controls: binder picker plus paste-a-link. */
export const Editable: Story = {
  args: { ...base, plex: MEMEPLEX, canEdit: true, linkable: BINDER },
}

/** A lonely meme with no relatives yet — only shown to someone who can link. */
export const NoRelatives: Story = {
  args: {
    ...base,
    plex: { original: null, ancestors: [], remixes: [], related: [] },
    canEdit: true,
    linkable: BINDER,
  },
}

/** Confirmation after a successful link. */
export const AfterLinking: Story = {
  args: {
    ...base,
    plex: MEMEPLEX,
    canEdit: true,
    linkable: BINDER,
    message: 'Added to the memeplex 🕸️',
  },
}

/** Still loading — the panel renders nothing until `plex` arrives. */
export const Loading: Story = {
  args: { ...base, plex: null, canEdit: false },
}
