import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import {
  buildLegalDocumentModel, legalCode, legalExternalLink, legalInAppLink, legalList, legalListItem,
  legalMailto, legalParagraph, legalStrong,
} from '../lib/legalDocumentModel'
import { LegalDocument } from '@/molecules/legal-document'

const model = buildLegalDocumentModel({
  title: 'Sample policy',
  updated: { prefix: 'Last updated:', datetime: '2026-07-06', label: 'July 6, 2026' },
  tocLabel: 'On this page',
  crossLink: { to: '/terms', label: 'Terms of Service' },
  sections: [
    {
      id: 'intro',
      heading: 'Introduction',
      blocks: [
        legalParagraph('A short legal intro with ', legalStrong('one bold clause'), ' and a ', legalCode('/slash-command'), '.'),
        legalList([
          legalListItem('first', legalStrong('First point:'), ' the opening item sits flush.'),
          legalListItem('second', legalStrong('Second point:'), ' every later item keeps the list rhythm.'),
        ]),
      ],
    },
    {
      id: 'details',
      heading: 'Details',
      blocks: [
        legalParagraph(
          'Routes stay in-app via ', legalInAppLink('/binder', 'the binder'),
          ', other sites open in a new tab via ', legalExternalLink('https://example.com', 'example.com'),
          ', and mail goes to ', legalMailto('hello@example.com', 'Sample subject', 'hello@example.com'), '.'),
      ],
    },
  ],
})

const meta = {
  title: 'Molecules/LegalDocument',
  component: LegalDocument,
  args: model,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LegalDocument>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* the TOC is a row of chips that navigate: Toggle classes on real anchors */
    const toc = canvasElement.querySelector('[data-slot="legal-toc"]')!
    const chips = [...toc.querySelectorAll('a')]
    await expect(chips).toHaveLength(2)
    await expect(chips[0]).toHaveAttribute('data-pressed', '')
    await expect(chips[1]).not.toHaveAttribute('data-pressed')
    await expect(chips[0]).toHaveAttribute('href', '#intro')
    /* one hairline between the sections, none after the last */
    await expect(canvasElement.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    /* the heading a chip jumps to is a real h2 and docks under the phone header */
    const heading = canvas.getByRole('heading', { level: 2, name: 'Introduction' })
    await expect(heading).toHaveAttribute('id', 'intro')
    await expect(getComputedStyle(heading).scrollMarginTop).not.toBe('0px')
  },
}

export const Dark: Story = { globals: { theme: 'dark' } }
