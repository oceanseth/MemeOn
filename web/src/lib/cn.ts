import { createCn } from 'cn/config'

/* `cn` cannot read the CSS `@theme`, so every namespace whose values its stock validators do not
   already accept is registered here, or two conflicting classes both survive a merge. `--color-*`
   (any name), `--breakpoint-*` and `--font-*` validate on their own; the named `--spacing-*` roles,
   `--container-*`, `--tracking-*` and any `--text-*` step that is not a t-shirt size do not — an
   unregistered `text-label` reads as a text *colour* and loses to `text-foreground`, an
   unregistered `h-control` survives beside `h-11`. Radii are stock names now and the materials are
   `:root` vars that only the `material-*` utilities paint, so neither namespace needs an entry.
   Add a group here whenever `@theme` grows. */
export const cn = createCn({
  extend: {
    theme: {
      container: ['card', 'measure', 'search', 'tabbar', 'card-narrow'],
      spacing: ['control', 'control-sm', 'icon', 'gutter', 'hit', 'page-x', 'card-inset', 'bloom', 'track', 'halo'],
      text: [
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
        'glyph-sm',
        'glyph',
        'glyph-lg',
        'glyph-hero',
      ],
      tracking: ['display', 'title', 'card-title'],
    },
  },
})
