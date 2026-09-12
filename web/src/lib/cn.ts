import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* tailwind-merge cannot read the CSS `@theme`, so every namespace whose values are not already
   accepted by its stock validators must be registered here or conflicting classes both survive.
   `--color-*` (any name), `--breakpoint-xs…4xl` and `--font-*` already validate; `--radius-*`,
   `--shadow-*`, `--container-*`, `--tracking-*` and any `--text-*` that is not a t-shirt size do
   not — an unregistered `text-display` would be read as a text *colour* and lose to `text-ink`.
   Add a group here whenever `@theme` grows. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['card', 'control', 'field', 'nav', 'avatar', 'chip', 'shell', 'tabbar', 'pill'],
      shadow: ['raised', 'pressed', 'pop', 'modal'],
      container: ['app', 'page'],
      text: [
        'hero',
        'hero-phone',
        'display',
        'display-phone',
        'section',
        'section-phone',
        'title',
        'card-title',
        'card-title-phone',
        'intro',
        'body',
        'label',
        'small',
        'caption',
        'micro',
      ],
      tracking: ['display', 'title', 'card-title', 'ui'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
