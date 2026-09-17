import { Input as BaseInput } from '@base-ui/react/input'
import type { InputProps } from '@base-ui/react/input'
import { cva } from 'class-variance-authority'
import type { Styled } from '@/atoms/field'
import { cn } from '@/lib/cn'

/**
 * The recessed well every text control shares (Select's trigger and Textarea compose it).
 * `font-normal` resists Field's 600 weight; the coarse-pointer 16px floor stops iOS zooming on
 * focus.
 *
 * There is deliberately nothing here for `type="file"`. A file input paints a sentence the browser
 * writes ("No file chosen") beside its selector button, and styling only the button leaves the
 * words; `atoms/file-drop` is the control that picks a file. `scripts/check-native-controls.mjs`
 * holds that line.
 */
export const inputVariants = cva([
  'h-12.5 min-w-0 rounded-md material-pressed px-4.5',
  'text-base font-normal text-foreground pointer-coarse:text-[length:max(16px,1em)]',
  'placeholder:font-normal placeholder:text-muted-foreground placeholder:opacity-100',
  'focus-ring disabled-look',
  'data-invalid:inset-ring-2 data-invalid:inset-ring-destructive',
  'aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive',
  'pointer-coarse:[&[type=number]]:min-w-18',
])

export function Input({ className, type, ...props }: Styled<InputProps>) {
  return (
    <BaseInput
      type={type}
      data-slot="input"
      className={cn(inputVariants(), className)}
      {...props}
    />
  )
}
