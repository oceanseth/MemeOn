import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { giftablePaper, giftableSilver, holoMeme, listedHolo, memeplexEmpty, memeplexFamily } from '../../.storybook/fixtures'
import { MemeplexPanel } from './MemeplexPanel'
import { buildMemeplexPanelModel } from './memeplexPanelModel'

const handlers = { onPickChange: fn(), onPastedChange: fn(), onAdd: fn() }
const build = (overrides: Partial<Parameters<typeof buildMemeplexPanelModel>[0]> = {}) => buildMemeplexPanelModel({
  meme: holoMeme, plex: memeplexFamily, canEdit: false, binder: [], pick: '', pasted: '', notice: null, ...handlers, ...overrides,
})

const meta = {
  title: 'Organisms/MemeplexPanel', component: MemeplexPanel,
  decorators: [(Story) => <MemoryRouter><div style={{ maxWidth: 720 }}><Story /></div></MemoryRouter>],
  args: { model: build() },
} satisfies Meta<typeof MemeplexPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Family: Story = {}
export const EmptyReadOnly: Story = { args: { model: build({ plex: memeplexEmpty }) } }
export const EmptyEditor: Story = { args: { model: build({ plex: memeplexEmpty, canEdit: true, binder: [giftablePaper, giftableSilver, listedHolo] }) } }
export const EditorPicked: Story = { args: { model: build({ canEdit: true, binder: [giftablePaper, listedHolo], pick: listedHolo.id }) } }
export const PastedLink: Story = { args: { model: build({ canEdit: true, binder: [giftablePaper], pasted: 'https://memeon.ai/m/meme-listed' }) } }
export const Notice: Story = { args: { model: build({ notice: 'Added to the memeplex 🕸️' }) } }
export const Loading: Story = { args: { model: build({ plex: null }) } }
