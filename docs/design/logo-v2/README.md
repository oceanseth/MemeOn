# MemeOn logo v2 — noodle M in negative space

Bead: mo-nbl. Branch: `ox/logo-noodle-m` (worktree `memeon-wt-logo`, from origin/dev 15c9868).

Brief (Lou, 2026-09-22): keep the noodle/spaghetti vibe of the current brain-M mark
(`web/public/brand/memeon-logo-*.png`, Masky-generated, commit 2779618), drop the white
sticker outline, form the M with negative space between the noodles, and keep it
readable at 16x16 (favicon). Source brief and palette: `~/gts/memeon/PROMPT-01.md`,
`~/gts/memeon/COLORS.md`.

## Files

- `base-prompt.md` — invariant prompt block (negative-space M, no outline, 16px rules, palette).
  v1 (`base-prompt.v1.md`) was used for 01–10; 4 of the first 6 came back with a solid or
  noodle-outlined M, so v2 reframes the M as a die-cut/stencil knockout with an explicit
  "what the M is not" list. 11–50 use v2. `prompt.txt` in each result is the exact text sent.
- `reference-clause.md` — appended for variations with `ref: true`; the current logo is
  uploaded once as Higgsfield media `reference-upload-id.txt`.
- `variations.json` — 50 variation briefs across six axes (silhouette, construction,
  style, palette, background, letterform). Each `delta` is appended to the base prompt.
- `gen.sh NN` — idempotent: assembles `results/NN-slug/prompt.txt`, submits to
  `nano_banana_pro` (1k, 1:1, 2 credits), downloads `source.png`, writes
  `preview-{256,64,32,16}.png` plus nearest-neighbour `*-zoom.png` so 16/32 px are
  inspectable, and `meta.json` (job id).
- `results/NN-slug/critique.json` — written by the per-variation subagent:
  legible16 / negativeM / noOutline / noodleVibe (yes|partial|no), notes, tweak.
- `build-gallery.mjs` → `index.html` — review gallery: 256px preview, simulated browser
  tab (16px) and app bar (32px) on light and dark, zoomed 16/32, tags, critique, filters
  per axis and by 16px legibility, sort by critique score, page theme toggle, pick list
  (persisted in localStorage, shown bottom-right).

## Reproduce

```sh
./gen.sh 07            # one variation (skips generation if source.png exists)
node build-gallery.mjs # rebuild index.html
open index.html
```

`/docs` is git-excluded in this repo, so nothing here is committed; the chosen mark gets
exported into `web/public/brand/` on this branch as a follow-up.

## Outcome (2026-09-22, 50/50 generated, 100 credits)

Critique tally (subagent per card): negative-space M yes 34 / partial 2 / no 14; no outline 50/50;
noodle vibe yes 45; 16px legible yes 3 / partial 36 / no 11. Base v2 raised the negative-M hit
rate from 5/10 (wave 1) to 29/40. Pale backgrounds are the weak spot: 6 of 9 light variants came
back with a drawn white letter (02, 16, 26, 27, 34, 43). The model also likes to trace the M with a
strand instead of cutting it (01, 07, 08, 17, 28, 50).

`contact-256.webp`, `contact-32.webp`, `contact-16.webp`: all 50 in id order, row-major, 10 per row
(labels did not render, ImageMagick font issue). `picks.json` is the orchestrator shortlist shown
with a ★ in the gallery: 38, 36, 21, 22, 33, 42, 29, 25, 45, 20.

What actually helps 16px, from the sheets: a big M hole (36, 38), a tightly packed or few-strand
mass with no dark gaps between noodles (33, 45), or inverting to ink noodles on a brand colour so
the M is the bright shape (21, 22). Next roll: take 38's letterform and 21's inversion, 3-5 strands,
and ask for the M to fill 70% of the width.
