import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { privacyCopy as copy } from '../copy/privacy'
import { buildPrivacyScreenModel } from '../lib/privacyModel'
import { PrivacyScreen } from './PrivacyScreen'

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
  title: 'Screens/PrivacyScreen',
  component: PrivacyScreen,
  args: { model: buildPrivacyScreenModel() },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof PrivacyScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // every section is citable, and the on-this-page index reaches all seven
    const toc = canvas.getByRole('navigation', { name: copy.tocLabel })
    await expect(within(toc).getAllByRole('link')).toHaveLength(7)
    // the section users arrive for can be linked and jumped to
    await expect(canvas.getByRole('heading', { name: copy.deletion.heading })).toHaveAttribute(
      'id',
      'deletion',
    )
    await expect(
      canvas.getByRole('link', { name: copy.deletion.makePrivate.text }),
    ).toHaveAttribute('href', copy.deletion.makePrivate.to)
    await expect(
      canvas.getByRole('link', { name: copy.deletion.maskyDeveloper.text }),
    ).toHaveAttribute('href', copy.deletion.maskyDeveloper.href)
    await expect(canvas.getAllByRole('link', { name: copy.deletion.email })[0]).toHaveAttribute(
      'href',
      `mailto:${copy.deletion.email}?subject=${encodeURIComponent(copy.deletion.emailSubject)}`,
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
