import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Tabs, TabsContent, TabsList, type TabsListVariant, TabsTrigger } from '@/atoms/tabs'

const onValueChange = fn()

function ProfileTabs({
  variant,
  orientation,
}: {
  variant?: TabsListVariant
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <Tabs defaultValue="created" orientation={orientation} onValueChange={onValueChange}>
      <TabsList aria-label="Profile sections" variant={variant}>
        <TabsTrigger value="created">Created</TabsTrigger>
        <TabsTrigger value="binder">Binder</TabsTrigger>
        <TabsTrigger value="trades" disabled>
          Trades
        </TabsTrigger>
      </TabsList>
      <TabsContent value="created">Memes Lou minted.</TabsContent>
      <TabsContent value="binder">Cards Lou owns.</TabsContent>
      <TabsContent value="trades">Trades in flight.</TabsContent>
    </Tabs>
  )
}

const meta = {
  title: 'Atoms/Tabs',
  component: Tabs,
  render: () => <ProfileTabs />,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/** The pressed well; the active tab is the raised segment. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('tablist', { name: 'Profile sections' })
    await expect(list).toHaveAttribute('data-slot', 'tabs-list')
    await expect(list).toHaveAttribute('data-variant', 'default')
    await expect(list.offsetHeight).toBe(40)
    await expect(getComputedStyle(list).boxShadow).toContain('inset')
    const created = canvas.getByRole('tab', { name: 'Created', selected: true })
    await expect(created).toHaveAttribute('data-slot', 'tabs-trigger')
    await expect(created).toHaveAttribute('data-active')
    await expect(created.offsetHeight).toBe(34)
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Memes Lou minted.')
    await userEvent.click(canvas.getByRole('tab', { name: 'Binder' }))
    await expect(onValueChange).toHaveBeenCalledWith('binder', expect.anything())
    // Base UI keeps the outgoing panel for an exit frame, so the swap is a wait, not a read
    await waitFor(() => expect(canvas.getByRole('tabpanel')).toHaveTextContent('Cards Lou owns.'))
    await expect(canvas.getByRole('tab', { name: 'Trades' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/**
 * Arrow keys move focus along the list; Enter activates (Base UI's manual activation, the
 * default the atom keeps — `activateOnFocus` on the list switches to automatic).
 */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const created = canvas.getByRole('tab', { name: 'Created' })
    const binder = canvas.getByRole('tab', { name: 'Binder' })
    created.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(binder).toHaveFocus())
    await expect(created).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(binder).toHaveAttribute('aria-selected', 'true'))
    await waitFor(() => expect(canvas.getByRole('tabpanel')).toHaveTextContent('Cards Lou owns.'))
    await userEvent.keyboard('{ArrowLeft}')
    await waitFor(() => expect(created).toHaveFocus())
    await userEvent.keyboard(' ')
    await waitFor(() => expect(created).toHaveAttribute('aria-selected', 'true'))
  },
}

/** A row of raised pills; the active one sinks into the pressed well. */
export const Pills: Story = {
  render: () => <ProfileTabs variant="pills" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tablist')).toHaveAttribute('data-variant', 'pills')
    const created = canvas.getByRole('tab', { name: 'Created', selected: true })
    await expect(created.offsetHeight).toBe(46)
    await expect(getComputedStyle(created).boxShadow).toContain('inset')
  },
}

export const Vertical: Story = {
  render: () => <ProfileTabs orientation="vertical" />,
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('tablist')
    await expect(list).toHaveAttribute('data-orientation', 'vertical')
    await expect(getComputedStyle(list).flexDirection).toBe('column')
  },
}

export const Dark: Story = { ...Pills, globals: { theme: 'dark' } }
