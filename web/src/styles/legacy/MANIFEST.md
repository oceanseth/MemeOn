# Legacy stylesheet manifest

`src/index.css` at commit `6319b06` (3025 lines) was cut into the files below in its original
order and loaded into the `legacy` cascade layer by `src/index.css`. Cascade order is
`theme, base, legacy, components, utilities`: legacy beats Tailwind's preflight, so un-migrated
markup keeps its look, and loses to `components`/`utilities`, so a migrated component wins
without touching these files.

Lines 3–74 (the `:root` token block) now live in `src/index.css` as an `@theme` block plus a
`@layer base { :root }` alias block. Line 1 (`@import url('./tier-glow-borders.css')`) became
the first import in `index.css` here. Lines 76–3025 are verbatim in the numbered files, with one
deliberate change: in `51-a11y-media.css`, the `prefers-contrast: more` override
`--border: var(--border-strong)` became `--color-border: var(--color-border-strong)` so both the
alias and Tailwind utilities respond.

Verify:

```sh
git show 6319b06:web/src/index.css | sed -n '76,3025p' > /tmp/orig.css
cat web/src/styles/legacy/[0-9]*.css > /tmp/split.css
diff /tmp/orig.css /tmp/split.css   # exactly one line: the --color-border re-point
```

## Owners

Owner keys: `shared-atoms` (deleted only by the final legacy-removal package), `card`, `dialogs`,
`shell`, `landing`, `market`, `create`, `social`, `dev`. A file whose rules serve several owners is
`shared-atoms`, with the members listed; a surface package migrates its component and leaves the
now-dead rule in place for the final package to delete.

| File | Origin lines | Selectors / prefixes | Owner |
| --- | --- | --- | --- |
| `../../tier-glow-borders.css` | (separate file) | `@property --glow-angle`, `:where(.glow-border)` ring + bloom, `[data-glow-style=…]` stops, reduced-motion pause | card |
| `01-base.css` | 76–169 | `::selection`, `*`, `img/video/svg`, `body`, `#root`, `#root > main`, `h1–h4`, `p`, `code`, `.mono` | shared-atoms |
| `02-controls.css` | 170–343 | `a`, `button`/`.btn` (+ hover lift, disabled, `aria-busy`, `.primary`, `.danger`), `input/select/textarea`, placeholder, checkbox + `.checkbox-label`, `.field-label/.field-hint/.field-help/.field-counter`, the `:focus-visible` ring | shared-atoms |
| `03-container.css` | 344–356 | `.container`, `.container.narrow` | shared-atoms |
| `04-skip-link.css` | 357–379 | `.skip-link`, `main { scroll-margin-top }` | shell |
| `05-header.css` | 380–491 | `.topbar`, `.topbar-inner`, `.logo`, `.logo-img`, `.nav-links`, `.topbar-right`, `.discord-link`, `.coins`, `.avatar` | shell |
| `06-alerts-bell.css` | 492–578 | `.bell`, `.bell-badge`, `.alerts-pop`, `.alert-row` (+ `.unread`, `time`), `.alert-dot` | shell |
| `07-collections.css` | 579–624 | list resets for `.card-grid/.row-list/.tier-grid/.profile-stats/.invite-stats/.legal-toc`, `.card-grid`, `.market-grid`, `.memeplex-grid`, `.card-slot` | shared-atoms (members: card, market, social, landing) |
| `08-meme-card.css` | 625–931 | `.meme-card`, `.meme-card-inner`, `.meme-art`, `.meme-meta`, `.meme-title`, `.meme-sub`, `.tier-chip`, `.tier-paper … .tier-shiny`, `.meme-card-lg`, `.foil-media`, `.meme-media-toggle`, `.sheen`, `.sparkle`, `@keyframes sheen-sweep/twinkle` | card |
| `09-quests.css` | 932–1051 | `.questbar`, `.questbar-inner`, `.questbar-title`, `.braincell-img` (+ `.lg`, used by the FAQ), `.quest-chip*`, `.quest-more/.quest-later`, `.quest-hint`, `.questbar-error` | shell |
| `10-dialog-shell.css` | 1052–1139 | `.pack-modal h3`, `dialog.pack-modal`/`dialog.confirm-modal` frame + `::backdrop`, `dialog:not([open])`, `body:has(dialog[open])`, `.dialog-head`, `.modal-close`, ≤720 bottom sheet | dialogs |
| `11-gift-dialog.css` | 1140–1230 | `.alerts-pop/.pack-modal/.gift-list { scrollbar-width }`, `.gift-list`, `.gift-row*`, `.gift-thumb`, `.gift-dialog-*` | dialogs |
| `12-friends.css` | 1231–1238 | `.friends-panel`, `.friends-section` | social |
| `13-site-footer.css` | 1239–1256 | `.site-footer`, `.site-footer a` | shell |
| `14-prose-links.css` | 1257–1291 | underline rules for `.legal a`, `.faq a`, `.hero p a`, `.notice a`, `.site-footer a`; `a[aria-current]`; `a.btn` exception | shared-atoms (members: landing, shell, shared) |
| `15-confirm-dialog.css` | 1292–1333 | `.confirm-modal.confirm-danger`, `.confirm-message`, `.confirm-modal .field-label/textarea`, `.confirm-danger-btn` | dialogs |
| `16-leaderboard.css` | 1334–1382 | `.leader-row` (+ `.is-me`), `.leader-rank`, `.leader-medal`, `.row-head`, `.leader-cells` | social |
| `17-numeric.css` | 1383–1394 | tabular-nums for `.coins/.leader-cells/.meme-sub/.person-stats/.gift-row-shares/.cap-row/.bell-badge/.numeric` | shared-atoms |
| `18-hero.css` | 1395–1442 | `.hero`, `.hero h1`, `.grad`, `@supports not (background-clip: text)` (also `.logo`), `.hero p`, `.login-reassure` | landing |
| `19-login-btn.css` | 1443–1456 | `.login-btn` (landing, invite, discord, profile) | shared-atoms |
| `20-landing-sections.css` | 1457–1472 | `.landing-close`, `.section-title`, `.section-sub` | landing |
| `21-tier-showcase.css` | 1473–1566 | `.tier-grid` (+ ≥1100 four columns), `.tier-card`, `.tier-card-inner`, `.tier-frame-img`, `.tier-frame-slot[data-state]`, `.tier-name`, `.tier-req`, `.tier-hype` | landing |
| `22-faq.css` | 1567–1615 | `.faq`, `.faq details/summary/p`, `.faq-actions`, `.cta-slot` | landing |
| `23-link-status.css` | 1616–1629 | `.link-status` (+ ≤640) | dev |
| `24-profile-invite.css` | 1630–1733 | `.profile-avatar`, `.invite-avatar`, monogram fallbacks, `.profile-hero h1`, `.profile-identity*`, `.profile-stats`, `.profile-tabs`, `.binder-controls`, `.invite-hero`, `.invite-note`, `.invite-highlights-title`, `.invite-stats` | social |
| `25-market-controls.css` | 1734–1800 | `.market-controls`, `.market-filters`, `.market-filters-toggle`, `.market-summary`, ≤720 unstick | market |
| `26-page-head.css` | 1801–1842 | `.page-head`, `.page-subtitle`, `.filter-bar`, `.filter-bar input[type=search]`, ≥761 head layout | shared-atoms |
| `27-empty-state.css` | 1843–1900 | `.empty` (+ `.error`, `p`, headings), `.empty-actions`, `.page-state`, `.muted` | shared-atoms |
| `28-utilities.css` | 1901–1931 | `.stack`, `.stack-lg`, `.sr-only`, `.live-region` | shared-atoms |
| `29-panel.css` | 1932–1946 | `.panel`, `.panel :where(h3, h4)` | shared-atoms |
| `30-person-rows.css` | 1947–2037 | `.row-list`, `.person-row` (+ children, `.danger-text`), `.avatar-fallback`, `.person-name`, `.person-stats`, `.person-name.wrap`, `.key-label` (dev member) | social |
| `31-api-keys.css` | 2038–2058 | `.key-meta`, `.key-string` | dev |
| `32-spacer.css` | 2059–2062 | `.spacer` | shared-atoms |
| `33-online.css` | 2063–2127 | `.online-dot`, `.online-strip`, `.online-avatars`, `.online-friend`, `.person-link` | social |
| `34-create-form.css` | 2128–2169 | `.form-grid`, `.form-grid label`, `.create-layout`, `.create-rail` (+ ≥1000). `.form-grid` is also used by Trades compose and Developers | create (member: market) |
| `35-notice-badge.css` | 2170–2229 | `.notice` (+ `.error/.ok/.busy/.info`), `.badge`, `.badge.state` | shared-atoms |
| `36-trades.css` | 2230–2333 | `.trade-card*`, `.trade-parties`, `.trade-sides`, `.trade-swap`, `.trade-side`, `.trade-fieldset`, `.trade-compose` (+ ≥900) | market |
| `37-detail.css` | 2334–2368 | `.detail-layout`, `.detail-rail`, `.tier-ladder*` | market |
| `38-bp-detail.css` | 2369–2384 | ≤900: `.detail-layout` stack, `.meme-card-lg` cap | market |
| `39-bp-topbar.css` | 2385–2450 | ≤760: `:root:has(.nav-links) { --topbar-h }`, `.hero`, `.topbar-inner`, `.logo`, `.nav-links`, `.topbar-right`, `.trade-sides`, `.trade-swap` | shared-atoms (members: shell, landing, market) |
| `40-bp-480.css` | 2451–2467 | ≤480: `.discord-link`, `.alerts-pop` | shell |
| `41-bp-560.css` | 2468–2539 | ≤560: `.card-grid/.tier-grid` two-up, `.card-slot`, `.leader-*`, `.person-row .avatar`, `.meme-sub`, `.login-btn` | shared-atoms (members: card, landing, social, shared) |
| `42-bp-questbar.css` | 2540–2565 | ≤720: `.questbar-inner` scroller, `.questbar-words` | shell |
| `43-legal.css` | 2566–2639 | `.legal`, `.legal-date`, `.legal h1/h2/p/li/strong`, `.legal-key`, `.legal-toc`, `.legal-more` | landing |
| `44-sort-chips.css` | 2640–2645 | `.sort-chips` | market |
| `45-binder.css` | 2646–2684 | `.binder-collection-label`, `.binder-owned`, `.binder-owned-tags`, `.binder-owned-bar` | social |
| `46-sort-chip.css` | 2685–2705 | `.sort-chip`, `button.sort-chip.active`, `.sort-arrow` | market |
| `47-giphy.css` | 2706–2749 | `.giphy-mark`, `.giphy-grid`, `.giphy-cell` (+ `img`, `.picked`) | create |
| `48-spin.css` | 2750–2766 | `.spin`, `@keyframes rot` | shared-atoms |
| `49-loading.css` | 2767–2847 | `.loading-state`, `.skeleton` (+ `::after`, `@keyframes skeleton-sweep`), `.skeleton-card`, `.skeleton-row`, `.skeleton-block`, `.trade-card-skeleton`, `.profile-skeleton-*`, `.skeleton.profile-avatar` | shared-atoms (members: market, social) |
| `50-input-modality.css` | 2848–2919 | `@media (pointer: coarse)` 44px targets for buttons, chips, nav, footer, rows, inputs; touch `:active` feedback | shared-atoms |
| `51-a11y-media.css` | 2920–3025 | `prefers-reduced-motion`, `forced-colors`, `prefers-contrast: more` (token override re-pointed to `--color-border`) | shared-atoms |

`src/components/HeroVideo.css` is untouched and still imported by `HeroVideo.tsx`; it is unlayered,
so it now sits above every layer. No rule in it conflicts with a legacy rule today (its pills set
properties the `button` rules do not, and the focus ring is a zero-specificity `:where()`), so
nothing renders differently.

## Tailwind notes for the surface packages

- `@source not inline('container')` in `src/index.css` suppresses Tailwind's `container` utility
  because legacy markup uses `.container` for the 1180px page measure. Build the page measure
  from `mx-auto max-w-page` (or a `@utility`) and lift the exclusion in the final package.
- The only other class name shared by legacy markup and a generated utility is `sr-only`; the two
  rules are equivalent.
- Breakpoints are project widths (see the `@theme` comments): `max-lg:` is "under 721px", i.e.
  the legacy `max-width: 720px`; `xl:` is the legacy `min-width: 761px`.
- `--fs-md` maps to `text-base`; there is no `text-md`.
- `--text-xl`/`--text-2xl` carry a 1.2 line-height (the h2/h1 ladder); xs/sm/base/lg keep
  Tailwind's defaults.
- `--space-1 … --space-8` stay pixel literals in `:root`; Tailwind's rem scale (`p-1 … p-10`)
  matches them at a 16px root.

## Known transitional deltas (preflight under legacy)

Tailwind's preflight now sits in `base`, under `legacy`. Every declaration the legacy sheet
authored still wins, but preflight also resets what the legacy sheet left to the UA stylesheet,
and inherited values reach un-migrated markup. Each surface package rebuilds its screen against
the pre-migration reference look; do not patch these globally.

1. `html { line-height: 1.5 }` is inherited everywhere the legacy sheet set no line-height:
   buttons and `.btn` links (`font: inherit`) grow ~5px taller, and labels, chips, badges, list
   rows, `.meme-sub`, `.tier-chip`, `.quest-chip` and similar inline text open up from the UA
   `normal` to 1.5. `p` (1.55), `h1–h4` (1.2) and inputs (1.3) are unchanged.
2. `h1–h6 { font-weight: inherit }`: headings the legacy sheet sized but never weighted render at
   400 instead of the UA bold — `.page-head h1/h2`, `.hero h1`, `.section-title`, `.legal h1/h2`,
   `.empty h2/h3`, `.pack-modal h3`, `.profile-hero h1`, `.tier-ladder` and dialog `h3`s.
   `.panel :where(h3, h4)` (700), `.tier-name` (800) and `.faq summary` (600) keep theirs.
3. `* { margin: 0; padding: 0 }`: `p` loses its 1em UA margins in every prose block that relied on
   them (Terms, Privacy, FAQ answers keep `.faq p` padding only, Discord and Developers copy,
   `.confirm-message`); `ul`/`ol` lose the 40px indent and, with `ol, ul { list-style: none }`,
   their bullets and numerals — the unclassed `<ul>` in `PrivacyScreen` and the `<ol>` wrapping
   the tier ladder in `LandingScreen`. Lists the sheet already reset (`.card-grid`, `.row-list`,
   `.tier-grid`, `.profile-stats`, `.invite-stats`, `.legal-toc`) and `.trade-fieldset`/`legend`
   are unchanged.
4. `img, svg, video, … { display: block; vertical-align: middle }`: replaced elements that sat
   inline in text drop onto their own line — the `.braincell-img` inside the Leaderboard `<h2>`
   and inside the starter-pack dialog `<h3>` in `QuestBar`. Images inside flex/grid parents
   (avatars, `.logo`, `.discord-link`, `.faq-actions`, remix thumbnail) and the floated
   `.braincell-img.lg` are unaffected.
5. `textarea { resize: vertical }`: the Create-meme textareas lose horizontal resizing
   (`.confirm-modal textarea` already set vertical).
6. `small { font-size: 80% }` (UA `smaller`): `.quest-hint` is a `<small>` with its own
   `font-size`, so no visible change; noted for completeness.
7. `html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100% }`: iOS drops
   the grey tap flash and no longer inflates text after rotation.
8. Chrome/Safari widget cosmetics: `::-webkit-search-decoration` removed on the three
   `type="search"` fields; number spin buttons `height: auto` on the eight `type="number"` fields.
9. `[hidden] { display: none !important }`: no markup uses the `hidden` attribute, so no change.
10. Build pipeline: the legacy CSS is now compiled by Lightning CSS through `@tailwindcss/vite`.
    `color-mix()` declarations are emitted with an `@supports (color: color-mix(in lab, red,
    red))` pair and vendor prefixes are recomputed; evergreen browsers render the same values.
    Verified in the built bundle: `:has()`, `mask-composite`, `content-visibility`,
    `text-wrap: pretty`, `@property --glow-angle`, `dvh`, `env(safe-area-inset-*)`,
    `dialog:not([open])`, `label:has(> input)` all survive intact.

Observed in a 1280px before/after Storybook sweep of Landing, Marketplace, Meme detail, Create
meme, Terms, ConfirmDialog and Leaderboard: layouts, the dark theme, sticky chrome, foil frames
and dialogs render as before; the visible differences are exactly 1 (looser rows), 2 (regular-
weight page titles and FAQ/legal headings), 3 (tighter legal paragraphs) and 4 (the Leaderboard
braincell icon on its own line).

Not affected (authored by the legacy sheet, so preflight loses): `a` colour and decoration,
button/input/select/textarea chrome and radii, placeholder colour, `code` size, `body` margin,
`dialog` frame and `::backdrop`, focus rings (including Firefox `:-moz-focusring`).
