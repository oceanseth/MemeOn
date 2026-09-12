import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { TermsView } from './TermsView'

const meta = {
  title: 'Views/TermsView',
  component: TermsView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/terms']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TermsView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); await expect(canvas.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument(); await expect(canvas.getAllByRole('link', { name: 'seth@voicecert.com' })[0]).toHaveAttribute('href', 'mailto:seth@voicecert.com?subject=MemeOn%20takedown%20request'); await expect(document.title).toBe('Terms of Service — MemeOn') } }
