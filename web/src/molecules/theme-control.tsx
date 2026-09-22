import { cva, type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/atoms/button'
import { ToggleGroup, ToggleGroupItem } from '@/atoms/toggle-group'
import { Icon } from '@/atoms/icon'
import { cn } from '../lib/cn'
import type { ThemeControlModel } from '../lib/themeControlModel'
import type { ThemePreference } from '../stores/themeStore'

export type { ThemeControlModel }

/**
 * The header square wears the Button's own icon recipe (34px, raised, the coarse-pointer halo) and
 * owns the two things the atom has no axis for: the emoji's glyph step, and the growth to 40 past
 * the shell cut, where the public header has room for it. The classes go on a plain `<button>`
 * rather than through `<Button className>`, which is the restyle this variant replaces.
 */
const themeButtonVariants = cva('text-base leading-none', {
  variants: {
    size: {
      /** the phone cluster: the 34px square, at every width */
      sm: '',
      /** the public desktop header: 40px from the shell cut up */
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
    const current =
      model.options.find((option) => option.value === model.value) ?? model.options[0]!
    return (
      <button
        type="button"
        className={cn(
          buttonVariants({ size: 'icon-sm' }),
          themeButtonVariants({ size }),
          className,
        )}
        aria-label={model.cycleLabel}
        onClick={() => model.onChange(model.nextValue)}
        data-slot="theme-button"
        data-preference={model.value}
      >
        <span aria-hidden="true">
          <Icon name={current.icon} size={22} />
        </span>
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
      aria-label={model.groupLabel}
      variant="segment"
      size="sm"
      /* 224: three ~70px segments breathing inside the well's 4px inset (`p-1`) */
      className={cn('w-56', className)}
      data-slot="theme-segmented"
    >
      {model.options.map((option) => (
        <ToggleGroupItem<ThemePreference>
          key={option.value}
          value={option.value}
          data-slot="theme-segment"
        >
          <Icon name={option.icon} size={16} /> {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
