import { cva, type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/atoms/button'
import { ToggleGroup, ToggleGroupItem } from '@/atoms/toggle-group'
import { cn } from '../lib/cn'
import type { ThemePreference } from '../stores/themeStore'

/**
 * What the theme control renders from. The hook builds it off `useTheme()`; `variant` picks the
 * sidebar's segmented well or the header's one-glyph button (the screen overrides it per slot).
 */
export interface ThemeControlModel {
  value: ThemePreference
  onChange: (preference: ThemePreference) => void
  variant: 'segmented' | 'button'
}

/** The three states, in the order the button cycles them. Every glyph is an emoji and stays one. */
const OPTIONS: readonly { value: ThemePreference; emoji: string; label: string }[] = [
  { value: 'auto', emoji: '🌗', label: 'Auto' },
  { value: 'light', emoji: '☀️', label: 'Light' },
  { value: 'dark', emoji: '🌙', label: 'Dark' },
]

const optionFor = (value: ThemePreference) => OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!
const nextAfter = (value: ThemePreference) =>
  OPTIONS[(OPTIONS.findIndex((o) => o.value === value) + 1) % OPTIONS.length]!

/**
 * The header square wears the Button's own icon recipe (34px, raised, the coarse-pointer halo) and
 * owns the two things the atom has no axis for: the emoji's glyph step, and the growth to 40 past
 * the shell cut on a page with no sidebar to balance it. The classes go on a plain `<button>`
 * rather than through `<Button className>`, which is the restyle this variant replaces.
 */
const themeButtonVariants = cva('text-base leading-none', {
  variants: {
    size: {
      /** beside a sidebar or in the phone cluster: the 34px square, at every width */
      sm: '',
      /** the public desktop header: 40px once the page is wide enough to have no sidebar */
      lg: 'xl:size-10 xl:rounded-md xl:text-xl',
    },
  },
  defaultVariants: { size: 'sm' },
})

export interface ThemeControlProps extends VariantProps<typeof themeButtonVariants> {
  model: ThemeControlModel
  className?: string | undefined
}

/**
 * Auto · Light · Dark. Segmented is the `ToggleGroup` atom in its segment well (single-select);
 * the button cycles auto → light → dark and names both where it is and where it goes. Pure: the
 * value and the change handler come from the model.
 */
export function ThemeControl({ model, size, className }: ThemeControlProps) {
  if (model.variant === 'button') {
    const current = optionFor(model.value)
    const next = nextAfter(model.value)
    return (
      <button
        type="button"
        className={cn(buttonVariants({ size: 'icon-sm' }), themeButtonVariants({ size }), className)}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        onClick={() => model.onChange(next.value)}
        data-slot="theme-button"
        data-preference={model.value}
      >
        <span aria-hidden="true">{current.emoji}</span>
      </button>
    )
  }

  return (
    <ToggleGroup<ThemePreference>
      value={[model.value]}
      /* single-select: a press on the current segment reports an empty group, which is not a choice */
      onValueChange={(next) => {
        const [value] = next
        if (value) model.onChange(value)
      }}
      aria-label="Theme"
      variant="segment"
      size="sm"
      /* 184: three ~58px segments plus the well's 3px inset, which is why `p-0.75` stays */
      className={cn('w-46', className)}
      data-slot="theme-segmented"
    >
      {OPTIONS.map((option) => (
        <ToggleGroupItem<ThemePreference> key={option.value} value={option.value} data-slot="theme-segment">
          {option.emoji}
          {' '}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
