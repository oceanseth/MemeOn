import { createCn } from 'cn/config'

/* `cn` cannot read the CSS `@theme`, so every namespace whose values its stock validators do not
   already accept is registered here, or two conflicting classes both survive a merge. `--color-*`
   (any name), `--breakpoint-*` and `--font-*` validate on their own, and so do the type steps and
   the trackings now that both are stock t-shirt names. The named `--spacing-*` roles and
   `--container-*` do not — an unregistered `h-control` survives beside `h-11`. Radii are stock
   names too and the materials are `:root` vars that only the `material-*` utilities paint, so
   neither namespace needs an entry. Add a group here whenever `@theme` grows. */
export const cn = createCn({
  extend: {
    theme: {
      container: ['card', 'measure', 'search', 'tabbar', 'card-narrow'],
      spacing: ['control', 'control-sm', 'icon', 'gutter', 'hit', 'page-x', 'card-inset', 'bloom', 'track', 'halo'],
    },
  },
})
