import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* tailwind-merge cannot read the CSS `@theme`, so every namespace whose values are not already
   accepted by its stock validators must be registered here or conflicting classes both survive.
   `--color-*` (any name), `--text-xl/2xl`, `--breakpoint-xs…4xl` and `--font-*` already validate;
   `--radius-*`, `--shadow-*` and `--container-*` do not. Add a group here whenever `@theme` grows. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['card', 'control', 'pill'],
      shadow: ['pop', 'modal'],
      container: ['page'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
