# design-sync notes — MemeOn

## What this repo is (read first)

MemeOn is an **application**, not a published component library. The `web`
workspace is a private Vite app: no `main`/`module`/`exports`, no library
build, no `dist/` to bundle, no Storybook. Everything below exists to work
around that.

- **The entry is hand-written**: `.design-sync/entry.mjs`, passed via
  `--entry`. Do not drop it and let the converter synthesize from `src/` —
  a synth entry re-exports every `.tsx` under the source root, which drags in
  `web/src/lib/firebase.ts`. That file calls `initializeApp()` at **module
  scope**, so the bundle would initialize Firebase (and ship its config) on
  load in every preview and every design built with this DS.
- `PKG_DIR` resolves by walking up from `--entry`, landing on the repo root
  (`package.json` name `memeon`). All config paths are therefore
  **repo-root-relative** (`web/src/...`), not `web/`-relative.

## Scope: 3 of 8 components

Synced: `MemeCard`, `SortChips`, `ConfirmDialog` — the presentational ones.

Excluded (`componentSrcMap: null` is not used for these; they are simply not in
`entry.mjs`): `AlertsBell`, `GiftDialog`, `MemeplexPanel`, `QuestBar`,
`Layout`. Each either calls `apiFetch`/`post` on mount or reads `AuthContext`
(→ Firebase). They are also app screens rather than reusable primitives, so
they are poor design-system material regardless. Adding one means stubbing the
network and auth, not just writing a preview.

## Provider: `MemeOnSurface`

`.design-sync/surface.tsx`, re-exported from the entry, set as `cfg.provider`.
It exists for two independent reasons:

1. The preview card harness (`lib/emit.mjs`) hardcodes `body{background:#fff}`.
   MemeOn is dark-only, so without a dark wrapper every card renders on white
   and the active `sort-chip` treatment washes out to unreadable.
   `lib/emit.mjs` is explicitly not forkable, so the provider is the supported
   lever.
2. `MemeCard` renders a react-router `<Link>` and throws with no Router
   ancestor.

`MemoryRouter` is re-exported from the entry too. Both are kept out of the
component list via `componentSrcMap: null`.

## Verify the DESIGN path, not just the preview cards

**The preview cards are not representative.** `lib/emit.mjs` mounts every card
as `h(window.MemeOn.MemeOnSurface, {}, story)` — so previews always get the
provider. A rendered *design* gets only the `styles.css` closure plus the JS
bundle, with **no provider**. A component that hard-requires context passes the
entire preview/grade pipeline and then blanks in a real design.

This bit us: `MemeCard` renders `<Link>`, threw
`Cannot destructure property 'basename' of useContext(...)` with no Router, and
React unmounted the subtree — a **silent blank card**, no visible error.

Fix: `.design-sync/memecard.tsx` wraps the app's real `MemeCard` and supplies a
`MemoryRouter` only when `useInRouterContext()` is false, so it renders
standalone but still defers to a host router. `entry.mjs` exports the shim as
`MemeCard` and re-exports `tierClasses` from the app source.

Second finding from the same probe: `.meme-card` has no intrinsic width and
`.meme-art` is `aspect-ratio: 1; width: 100%`, so a bare `<MemeCard>` fills its
container and renders as a huge square. In the app it is always inside
`.card-grid` (`minmax(230px, 1fr)`). Not a component bug — documented in
`conventions.md` under "MemeCard needs a constrained width". Do NOT "fix" it by
adding a max-width to the shim: that would deviate from how the card sizes
inside the app's own grid.

`ds-bundle/.design-probe.html` (dot-prefixed, local, **recreate after each
build — `package-build.mjs` resets the out dir**) reproduces the design path:
bare page, no provider, renders each component standalone plus one inside a
host router. Drive it with `.ds-sync/_probe.mjs`. **Run it before any upload.**
Confirmed good after the fix: body `rgb(11,13,20)`, all three components
render, zero page errors.

## Environment gotchas

- **Chromium**: no playwright browser cache on this machine, but macOS Chrome
  is present. Run validate/capture with
  `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
  Only the `playwright` npm package is needed — skip the ~200MB browser
  download.
- **TypeScript must be v5** in `.ds-sync/`. On TS 7 the `.d.ts` parse check
  silently skips: validate does `await import('typescript')` and reads
  `ts.createSourceFile` off the namespace, which TS 7's ESM shape doesn't
  expose. The skip message claims "typescript not in node_modules", which is
  misleading — it is installed, just the wrong major.
- `guidelinesGlob: []` is deliberate. The repo's `docs/` holds deploy and
  bead-tracking process docs (`ENV_AND_DEPLOY.md`,
  `STATIC_ANALYSIS_TRACK.md`); the default glob swept them into `guidelines/`,
  where they'd be fed to the design agent as design guidance.

## Known render warns

- **`ConfirmDialog` / `Danger` cell reported as an error by
  `package-capture.mjs` — false positive, expected.** The harness treats a cell
  whose text starts with `⚠` as a caught error sentinel; `ConfirmDialog`
  prepends `⚠️ ` to its own title when `danger` is set. The cell renders
  correctly. Do not "fix" it by removing the glyph — that's real component
  behavior.
- `ConfirmDialog` uses `cardMode: "single"` because `.pack-overlay` is
  `position: fixed; inset: 0` and `[GRID_OVERFLOW]` correctly reports that no
  grid can present it. The `Overview` export is the primary story and
  deliberately shows the normal + danger variants side by side, so the single
  visible cell still carries the variant axis.

## Re-sync risks

- **Tier data is inlined** in `.design-sync/previews/MemeCard.tsx` (keys,
  names, rarities, colors copied from `shared/tiers.ts`). If the tier ladder
  changes upstream, the preview silently shows stale tiers. Re-check against
  `shared/tiers.ts` on any sync that touches tiers.
- **`MemeOnSurface` duplicates the `body` background** from
  `web/src/index.css`. If that gradient changes, update `surface.tsx` to match
  or previews drift from the real app.
- **`conventions.md` enumerates class names** from `_ds_bundle.css`. The
  README header is only as true as that list — re-run the validation pass
  (grep every named class/token against the built CSS) on each sync.
- The excluded five components are excluded by *omission from `entry.mjs`*, so
  nothing warns if someone adds them back. If the component count jumps from 3,
  check the entry.
- Preview art uses inline data-URI SVGs, not real MemeOn media — deliberate, so
  the render check needs no network.
