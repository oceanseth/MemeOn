import { Input as BaseInput } from '@base-ui/react/input'
import type { InputProps } from '@base-ui/react/input'
import { cva } from 'class-variance-authority'
import type { Styled } from '@/atoms/field'
import { cn } from '@/lib/cn'

/**
 * The recessed well every text control shares (Select's trigger and Textarea compose it).
 * `font-normal` resists Field's 600 weight; the coarse-pointer 16px floor stops iOS zooming on
 * focus; the `file:` rules give a file input's selector button the app's own raised pill.
 */
export const inputVariants = cva([
  'h-12.5 min-w-0 rounded-md material-pressed px-4.5',
  'text-label font-normal text-foreground pointer-coarse:text-[length:max(16px,1em)]',
  'placeholder:font-normal placeholder:text-muted-foreground placeholder:opacity-100',
  'file:mr-2.5 file:cursor-pointer file:rounded-lg file:material-raised',
  'file:px-3 file:py-1.5 file:text-small file:font-semibold file:text-foreground',
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
