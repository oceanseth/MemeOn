# Cascade layer order in the production bundle — measured

Why `scripts/check-layers.mjs` exists, and the numbers it was written against. Everything below
is from `npm run build` + `npm run preview -- --port 4180` in this worktree, read with Playwright
(Chromium) at 480x900 and 1280x900 on `/`. Three states were built and measured.

| state | what it is |
| --- | --- |
| **S0** | `ox/ui` at `a81747f`, untouched |
| **S1** | the fix absent: `main.tsx`'s HEAD import order, and the order statement stripped from every co-located CSS file (this is the state the reviewer reproduced at `fff8e24`) |
| **S2** | this change: `import './index.css'` first in `main.tsx`, every co-located CSS file restating the order |

## The first `@layer` token in `dist/assets/index-*.css`

Plain CSS parse (comments and quoted strings skipped), first six declarations, in order:

- **S0** `@layer properties,theme,base,legacy,components,utilities;` then `@layer components{` ×3,
  `@layer properties{`, `@layer theme{`. Correct — but *by accident*: that statement is
  `atoms/MemeCard.css`'s restatement, which happens to be the first co-located sheet Vite emits.
  `index.css`'s own content starts 7.6 kB later. Any change to the module graph that put
  `Skeleton.css`, `Spinner.css` or `LandingScreen.css` ahead of `MemeCard.css` reverted it to S1.
- **S1** `@layer components{`, `@layer components{`, `@layer components{`, `@layer properties{`,
  `@layer theme{`, `@layer base{`. Effective order **components < properties < theme < base <
  legacy < utilities** — `components` is the *lowest* layer in the document. There is no full
  order statement anywhere in the file: lightningcss reduced `index.css`'s
  `@layer theme, base, legacy, components, utilities;` to a bare `@layer components;` at byte
  52 492, because by then every other name had already been pinned by a block.
- **S2** `@layer properties{`, `@layer theme{`, `@layer base{`, `@layer legacy{`,
  `@layer components;`, `@layer utilities{`. Effective order **properties < theme < base < legacy
  < components < utilities**. `index.css` now leads the bundle, and the co-located sheets follow
  at byte 86 778 onward, each opening with its (now redundant, deliberately kept) restatement.

Note the shape of S2: with `index.css` first, Tailwind and lightningcss **respell** the order
statement as blocks — `@layer properties { … }` is literally the first token, not a statement.
That is the same order, and it is why the guard checks the order a stylesheet *establishes*
(first mention of each name, statements and blocks alike) rather than the syntax of its first
token. A syntactic "first declaration must be a statement" rule fails S2, which is correct.

The async chunk improves too: `dist/assets/Skeleton-*.css` opened with a bare `@layer components{`
in S0 and S1 and opens with the full order statement in S2 — which is why the guard rejects even
S0, whose entry stylesheet is (accidentally) fine:

```
Skeleton-DxAExBSE.css: ranks its layers components — it has to rank theme < base < legacy < components < utilities, each one above the last
Skeleton-DxAExBSE.css: opens with a bare @layer components { … } block, so components is pinned as the lowest layer here
```

## The observable in the browser

`/` renders the tier ladder, whose `<li data-slot="tier-card">` carries `glow-border tier-paper`.
Both the migrated `atoms/MemeCard.css` (layer `components`) and the legacy `src/tier-glow-borders.css`
(layer `legacy`) style `:where(.glow-border)::before` / `::after` at *identical* zero specificity,
so nothing but the layer rank decides the winner — and they name different keyframes.

| probe | S0 | S1 (fix absent) | S2 (fixed) |
| --- | --- | --- | --- |
| `getComputedStyle(li[data-slot=tier-card], '::before').animationName` | `card-glow-turn` | **`glow-border-turn`** | `card-glow-turn` |
| `getComputedStyle(li[data-slot=tier-card], '::after').animationName` | `card-glow-turn` | **`glow-border-turn`** | `card-glow-turn` |
| `…'::before'.backgroundImage` contains `conic-gradient` | yes | yes | yes |
| `…'::before'.padding` | `3px` | `3px` | `3px` |
| `…'::after'.filter` | `blur(10px)` | `blur(10px)` | `blur(10px)` |
| `getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')` | `65px` | `65px` | `65px` |
| `node scripts/check-layers.mjs dist` | **exit 1** (async chunk) | **exit 1** (entry + chunk) | pass |

Identical at 480x900 and 1280x900.

`glow-border-turn` is the legacy sheet winning: in S1 every rule in `components` loses to
`legacy`, which is exactly the inversion the migration is built on top of. The ring still paints
(both layers draw a conic-gradient ring, byte-for-byte copied) — the animation *name* is what
exposes which layer supplied it, which is why it is the probe of record here.

Two probes the task suggested that turn out **not** to discriminate, worth writing down so nobody
re-runs them:

- `--topbar-h` — WP2-shell's `:root:has([data-slot=nav-links]) { --topbar-h: 127px }` override is
  not merged on this tree, so `65px` is the only value any state can produce. Injecting a
  `<div data-slot="nav-links">` changes nothing here. It is still the right probe once that
  override lands.
- A `Skeleton`'s `animation-name` — it is set by the Tailwind arbitrary-value utility
  `after:animate-[atom-skeleton-sweep_1.4s_linear_infinite]`, which lives in `utilities`. The
  inversion demotes `components` only; `utilities` is still the *last* layer declared in S1
  (`@layer utilities{` at byte 52 510, after everything), so it keeps beating legacy's
  `.skeleton::after { animation: skeleton-sweep }` in every state. `atom-skeleton-sweep` resolves
  identically in S0, S1 and S2.

## What actually fixed it

`main.tsx` importing `./index.css` first is the fix — it is what makes the bundle's leading bytes
`index.css`'s. The restatement in each co-located CSS file is the belt: those files still ship as
their own stylesheets (the async `Skeleton-*.css` chunk, Storybook stories, any future entry), and
a stylesheet that opens with a bare `@layer components {` inverts the order wherever it lands
first. `scripts/check-layers.mjs`, wired into `build` right after `vite build`, reads every
`dist/assets/*.css` back and fails the build if either guarantee is ever lost.

## Where the restatement earns its keep

`npm run build-storybook` splits every co-located sheet into its own lazily-injected chunk. In S2
each one opens with the order statement:

```
LandingScreen-B7IPiTh9.css  @layer properties,theme,base,legacy,components,utilities;  @layer components{
MemeCard-CD4R3iJO.css       @layer properties,theme,base,legacy,components,utilities;  @layer components{
Skeleton-BK8vWsz5.css       @layer properties,theme,base,legacy,components,utilities;  @layer components{
Spinner-a9AJbjRk.css        @layer properties,theme,base,legacy,components,utilities;  @layer components{
iframe-BRsUBJOp.css         @layer properties{  @layer theme{  @layer base{  @layer legacy{
```

In S0/S1 three of those four opened with a bare `@layer components{`.
`node scripts/check-layers.mjs storybook-static` passes on S2 (8 stylesheets, 5 layered); only
`dist` is wired into `build`.
