# Building with MemeOn

MemeOn is a **dark-only, token-driven, semantic-class** design system for a
meme trading-card app. It is not a utility-class system — there is no `p-4`,
no `bg-surface-1`. You style with the plain class names below and with
`var(--*)` tokens.

## Wrap everything in `MemeOnSurface`

```jsx
<MemeOnSurface>
  <div className="container">…your UI…</div>
</MemeOnSurface>
```

`MemeOnSurface` supplies two things the components assume:

1. **The dark canvas** — `--bg` plus two radial glows, and `--text` as the base
   color. Rendered on the browser default white, borders and the active
   `sort-chip` treatment wash out to near-invisible.
2. **Router context** — `MemeCard` renders a react-router `<Link>`. It ships
   router-safe (it supplies its own `MemoryRouter` when there isn't one), so it
   won't blank out on its own, but inside `MemeOnSurface` its links share your
   router instead. `MemoryRouter` is exported if you want to supply your own.

Skipping the wrapper is the single most common way MemeOn UI renders wrong —
you get browser-default white behind light text.

## `MemeCard` needs a constrained width

`.meme-card` has **no intrinsic width**, and `.meme-art` is
`aspect-ratio: 1; width: 100%`. A bare `<MemeCard>` therefore fills its
container and the art blows up into a giant square. Always give it a
width-constrained parent. `card-grid` is the app's own answer:

```jsx
<div className="card-grid">
  {memes.map((m) => <MemeCard key={m.id} meme={m} />)}
</div>
```

`card-grid` is `repeat(auto-fill, minmax(230px, 1fr))` — cards land at ~230–300px.
For a single card outside a grid, constrain it yourself:

```jsx
<div style={{ width: 260 }}><MemeCard meme={m} /></div>
```

## Tokens

All 12 live in `:root` and are the only palette you should use:

| Purpose | Tokens |
|---|---|
| Surfaces | `--bg` `--bg-raised` `--bg-card` |
| Line work | `--border`, `--radius` (14px) |
| Text | `--text` `--text-dim` |
| Accents | `--accent` (cyan) `--accent-2` (pink) `--gold` |
| Status | `--danger` `--ok` |

Reach for a token before a literal: `style={{ color: 'var(--text-dim)' }}`.

## Class vocabulary

Layout and chrome — compose your own screens from these:

| Family | Classes |
|---|---|
| Shell | `container` `topbar` `topbar-inner` `topbar-right` `nav-links` `site-footer` `hero` `page-head` |
| Surfaces | `panel` `card-grid` `row-list` `section-title` `section-sub` `spacer` |
| Controls | `filter-bar` `sort-chips` / `sort-chip` `quest-chip` `login-btn` |
| Feedback | `badge` `notice` `empty` |
| Modals | `pack-overlay` + `pack-modal` (`confirm-modal` narrows it) |
| Domain | `meme-card` `meme-art` `meme-meta` `meme-title` `meme-sub` `tier-chip` `tier-grid` `tier-card` `leader-row` `trade-card` `avatar` `coins` |

Buttons are styled by element + modifier, not by a base class:
`<button>` (default), `<button className="primary">`,
`<button className="danger">`. `:disabled` is handled for you.

Tier treatment is a class pair on `meme-card`: `tier-paper` `tier-silver`
`tier-holo` `tier-chrome` `tier-gold` `tier-prismatic` `tier-shiny`, plus
`sheen` and `sparkle` for the higher tiers. The exported `tierClasses(tierKey)`
helper returns the right combination — call it rather than assembling by hand.

## Where the truth is

- `_ds/<folder>/styles.css` and its `@import`s — every rule and token above.
  Read it before inventing a class; if a name isn't in there, it doesn't exist.
- `components/<Name>/<Name>.prompt.md` — per-component props and usage.

## Idiomatic example

```jsx
<MemeOnSurface>
  <div className="container">
    <div className="page-head">
      <h2 className="section-title">Marketplace</h2>
      <span className="section-sub">Shares currently for sale</span>
    </div>
    <SortChips sortKey={key} dir={dir} onChange={setSort} />
    <div className="card-grid">
      {memes.map((m) => (
        <MemeCard
          key={m.id}
          meme={m}
          footer={<button className="primary">Buy</button>}
        />
      ))}
    </div>
  </div>
</MemeOnSurface>
```
