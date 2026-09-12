import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
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

const FOCUS = cn(
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
)

/** components.md › Theme changer: 184×40, padding 3, gap 2, radius 20, a pressed well. */
const WELL = 'inline-flex h-10 w-[184px] shrink-0 items-center gap-0.5 rounded-[20px] bg-surface-pressed p-[3px] shadow-pressed'

/** Three equal segments, 34 tall, radius 17; the current one is raised and bold. */
const SEGMENT = cn(
  'inline-flex h-[34px] min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[17px] border-0 bg-transparent px-1',
  'text-micro font-semibold whitespace-nowrap text-ink-muted',
  '[transition:background_var(--dur-base)_ease,color_var(--dur-base)_ease,box-shadow_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  'hover:text-ink',
  'aria-pressed:bg-surface-raised aria-pressed:font-bold aria-pressed:text-ink aria-pressed:shadow-raised',
  FOCUS,
)

/**
 * The header button: 34×34 radius 13, raised, the emoji of the current state. The public desktop
 * header grows it to 40 through `className`. On coarse pointers a transparent 5px halo brings the
 * hit target to 44 without changing the drawn size.
 */
const BUTTON = cn(
  'relative inline-flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[13px] border-0 p-0',
  'bg-surface-raised text-[16px] leading-none text-ink shadow-raised',
  'pointer-coarse:before:absolute pointer-coarse:before:-inset-[5px] pointer-coarse:before:content-[""]',
  FOCUS,
)

/**
 * Auto · Light · Dark. Segmented is a Base UI ToggleGroup in single-select mode; the button cycles
 * auto → light → dark and names both where it is and where it goes. Pure: the value and the change
 * handler come from the model.
 */
export function ThemeControl({ model, className }: { model: ThemeControlModel; className?: string }) {
  if (model.variant === 'button') {
    const current = optionFor(model.value)
    const next = nextAfter(model.value)
    return (
      <button
        type="button"
        className={cn(BUTTON, className)}
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
      className={cn(WELL, className)}
      data-slot="theme-segmented"
    >
      {OPTIONS.map((option) => (
        <Toggle<ThemePreference> key={option.value} value={option.value} className={SEGMENT} data-slot="theme-segment">
          {option.emoji}
          {' '}
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  )
}
