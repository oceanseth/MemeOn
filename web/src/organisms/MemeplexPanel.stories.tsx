import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import {
  giftablePaper,
  giftableSilver,
  holoMeme,
  listedHolo,
  memeplexEmpty,
  memeplexFamily,
} from '../../.storybook/fixtures'
import { MemeplexPanel } from './MemeplexPanel'

const meta = {
  title: 'Organisms/MemeplexPanel',
  component: MemeplexPanel,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 720 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    meme: holoMeme,
    plex: memeplexFamily,
    canEdit: false,
    binder: [],
    pick: '',
    onPickChange: fn(),
    pasted: '',
    onPastedChange: fn(),
    notice: null,
    onAdd: fn(),
  },
} satisfies Meta<typeof MemeplexPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Family: Story = {}
export const EmptyReadOnly: Story = { args: { plex: memeplexEmpty, canEdit: false } }
export const EmptyEditor: Story = {
  args: {
    plex: memeplexEmpty,
    canEdit: true,
    binder: [giftablePaper, giftableSilver, listedHolo],
  },
}
export const EditorPicked: Story = {
  args: {
    canEdit: true,
    binder: [giftablePaper, listedHolo],
    pick: listedHolo.id,
  },
}
export const PastedLink: Story = {
  args: {
    canEdit: true,
    binder: [giftablePaper],
    pasted: 'https://memeon.ai/m/meme-listed',
  },
}
export const Notice: Story = { args: { notice: 'Added to the memeplex 🕸️' } }
export const Loading: Story = { args: { plex: null } }
