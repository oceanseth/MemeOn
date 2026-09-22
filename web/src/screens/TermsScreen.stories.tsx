import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { termsCopy as copy } from '../copy/terms'
import { buildTermsScreenModel } from '../lib/termsModel'
import { TermsScreen } from './TermsScreen'

const phone = {
  parameters: {
    viewport: {
      options: {
        phone390: {
          name: 'Phone 390',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/TermsScreen',
  component: TermsScreen,
  args: { model: buildTermsScreenModel() },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TermsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // every section is citable, and the on-this-page index reaches all eight
    const toc = canvas.getByRole('navigation', { name: copy.tocLabel })
    await expect(within(toc).getAllByRole('link')).toHaveLength(8)
    await expect(
      canvas.getByRole('heading', { name: copy.claimsAndTakedowns.heading }),
    ).toHaveAttribute('id', 'claims-and-takedowns')
    // the named destinations are real links, not prose
    await expect(
      canvas.getByRole('link', {
        name: copy.claimsAndTakedowns.claimFlow.text,
      }),
    ).toHaveAttribute('href', copy.claimsAndTakedowns.claimFlow.to)
    await expect(
      canvas.getByRole('link', {
        name: copy.thirdPartyServices.discordTerms.text,
      }),
    ).toHaveAttribute('href', copy.thirdPartyServices.discordTerms.href)
    // the takedown mailto arrives routable
    await expect(
      canvas.getAllByRole('link', { name: copy.claimsAndTakedowns.email })[0],
    ).toHaveAttribute(
      'href',
      `mailto:${copy.claimsAndTakedowns.email}?subject=${encodeURIComponent(copy.claimsAndTakedowns.emailSubject)}`,
    )
    // the document ends on a route forward, not an orphan address
    await expect(canvas.getByRole('link', { name: copy.crossLink.label })).toHaveAttribute(
      'href',
      copy.crossLink.to,
    )
  },
}

export const Dark: Story = {
  ...Default,
  name: 'Default dark',
  globals: { theme: 'dark' },
}

export const Phone390: Story = {
  ...Default,
  name: 'Default phone 390',
  ...phone,
}

export const DarkPhone390: Story = {
  ...Default,
  name: 'Default dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
