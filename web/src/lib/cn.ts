import { createCn } from 'cn/config'

/* `cn` cannot read the CSS `@theme`, so a namespace whose values its stock validators do not
   already accept is registered here, or two conflicting classes both survive a merge. `--color-*`
   (any name), `--breakpoint-*` and `--font-*` validate on their own, and so do the type steps,
   the trackings, the radii and — since the role names folded to the grid — every length. The one
   survivor is `--container-card-narrow`, a container-query cut whose `max-w-card-narrow` form
   would otherwise sit unmerged beside a stock `max-w-*`. The materials are `:root` vars that only
   the `material-*` utilities paint. `scripts/check-tokens.mjs` fails if this list and `@theme`
   ever disagree. */
export const cn = createCn({
  extend: {
    theme: {
      container: ['card-narrow'],
    },
    /* The materials are one axis: an element wears exactly one fill+relief. They are `@utility`
       rules cn cannot see, so without this group `cn(inputVariants(), 'material-raised')` keeps
       both and the winner is whichever sorts later in the built sheet (equal declaration counts →
       alphabetical). `glass` is deliberately NOT here: `material-raised glass` is a real pair —
       the plate is glass, the relief is raised. */
    classGroups: {
      material: ['material-card', 'material-raised', 'material-pressed', 'material-pop', 'material-modal'],
    },
  },
})
