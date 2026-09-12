import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { PrivacyScreen } from './PrivacyScreen'

const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/PrivacyScreen',
  component: PrivacyScreen,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof PrivacyScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // every section is citable, and the on-this-page index reaches all seven
    const toc = canvas.getByRole('navigation', { name: 'On this page' })
    await expect(within(toc).getAllByRole('link')).toHaveLength(7)
    // the section users arrive for can be linked and jumped to
    await expect(canvas.getByRole('heading', { name: 'Deletion' })).toHaveAttribute('id', 'deletion')
    await expect(canvas.getByRole('link', { name: 'make any meme private' })).toHaveAttribute(
      'href',
      '/binder',
    )
    await expect(
      canvas.getByRole('link', { name: 'masky.ai/developer → Connected apps' }),
    ).toHaveAttribute('href', 'https://masky.ai/developer')
    await expect(canvas.getAllByRole('link', { name: 'seth@voicecert.com' })[0]).toHaveAttribute(
      'href',
      'mailto:seth@voicecert.com?subject=MemeOn%20account%20deletion',
    )
    // the document ends on a route forward, not an orphan address
    await expect(canvas.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms',
    )
  },
}

export const Dark: Story = { ...Default, name: 'Default dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Default, name: 'Default phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Default,
  name: 'Default dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
