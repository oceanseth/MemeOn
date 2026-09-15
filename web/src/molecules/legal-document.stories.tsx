import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
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

export const Default: Story = {}

export const Dark: Story = { globals: { theme: 'dark' } }
