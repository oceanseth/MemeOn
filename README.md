# MemeOn

MemeOn.ai — the meme trading card market. Users log in with **Masky SSO**, mint memes
(generated with their own Masky credits or from a URL), and each meme becomes a
100-share collectible. Every meme has a unique share URL (`memeon.ai/m/{id}`) whose
**og-meta card frame levels up** through pokemon-style foil tiers as the link gets
reshared. Users invest in memes, trade positions with friends, and get alerts when
their memes sell or tier up.

## Virality tiers

Defined once in `shared/tiers.ts` (used by API and web):

| Tier | Rarity | Reshares | Foil |
| --- | --- | --- | --- |
| Paper | Common | 0+ | matte cardboard |
| Silver | Uncommon | 10+ | silver stamp |
| Holo | Rare | 50+ | holographic shimmer |
| Chrome | Ultra Rare | 250+ | liquid chrome |
| Gold | Legendary | 1,000+ | gold foil |
| Prismatic | Secret Rare | 5,000+ | prismatic conic foil |
| Shiny | Mythic Shiny | 25,000+ | ✨ cosmic sparkle ✨ |

Every load of `/m/{id}` (human click, Discord unfurl, crawler) increments the reshare
counter, recomputes the tier, alerts all position holders on tier-up, and serves og
meta whose image is the meme composited into its current tier frame
(`api/src/og.ts`, cached at `og/{memeId}-{tier}.png` in the assets bucket).
Tier frame art is generated with the Masky image API (`api/scripts/generate-frames.ts`).

## Project layout

- `shared/` – tier definitions + valuation shared by web and api.
- `web/` – React + Vite SPA ("Soft Press", light and dark): Landing/FAQ (tier
  showcase), Marketplace (filters + search), My Binder (collection + mint via Masky
  image/video gen, URL, upload, remix, GIPHY), Friends (requests, portfolio stats,
  RTDB online presence), Trade (propose/respond/history), Top Brains leaderboard,
  Settings (theme, connections), Developers (API keys), Discord link, invite landing,
  public `/u/:sub` and `/binder/:sub`, meme detail with cap table, listing, buying,
  share link. Structure and rules: [`web/src/Anatomy.mdx`](web/src/Anatomy.mdx)
  (also the "Anatomy" page in Storybook). See [Web UI](#web-ui) below.
- `api/` – Lambda (esbuild-bundled) + Express dev bridge. DynamoDB single-table,
  Masky OAuth + aigen proxy, session JWTs, og pipeline (jimp), alerts, and the
  mobile feed layer (likes/dislikes/follows, friend-prioritized `/api/feed`,
  creator profiles, hourly value-history sampling).
- `mobile/` – Expo React Native app in the pnpm workspace:
  infinite swipe feed, invest view, creator profiles. See `mobile/README.md`
  for App Store / Play publishing via EAS.
- `infra/terraform/` – production stack (memeon.ai). **Note:** no state is kept in
  this repo; prod changes since the original apply were made with the AWS CLI and
  these files were updated to match as documentation. Re-import before applying.
- `infra/terraform/dev/` – dev stack (dev.memeon.ai), separate root/state.
- `.github/workflows/` – `deploy.yml` (production branch → memeon.ai),
  `deploy-dev.yml` (dev branch → dev.memeon.ai).

## Auth (Masky SSO)

`GET /api/auth/masky/config` → client redirects to Masky authorize →
`POST /api/auth/masky/callback` exchanges the code and returns:

- `sessionToken` — our HS256 JWT (30d), gates all `/api/*` authed routes.
- `maskyAccessToken` — scoped `mky_` token stored client-side; sent as
  `x-masky-token` on aigen endpoints so generation bills the user's credits.
- `firebaseToken` — custom token for the memeon Firebase project (RTDB presence).

The OAuth client (`mkc_…`) is registered for `memeon.ai`, `dev.memeon.ai`, and
`localhost` with scopes `profile avatars:read generate`.

## Environments

| | production | dev |
| --- | --- | --- |
| site | memeon.ai (CF `EMLGLTTNC62L0`) | dev.memeon.ai (CF `E2AM94MLXIMHST`) |
| lambda | `memeon-api` | `memeon-api-dev` |
| api gw | `mdv6q8qv28` | `pqxie1uj27` |
| table | `memeon-production` | `memeon-dev` |
| assets | `memeon-assets-production` | `memeon-assets-dev` (public read) |
| ssm | `/memeon/production/*` | `/memeon/dev/*` |

SSM params (us-west-2, SecureString): `masky_oauth` (client_id/client_secret),
`session_secret`, `firebase_service_account`.

Deploys: push to `production` → memeon.ai; push to `dev` → dev.memeon.ai
(config in `config/deploy.json` / `config/deploy.dev.json`; GitHub environments
`production` / `dev` hold AWS credentials).

## Local development

```
corepack enable
corepack pnpm install
pnpm run dev
```

The root workspace includes `web`, `api`, `mobile`, and `shared`. Use
`pnpm --filter mobile start` for Expo, `pnpm run build` for the web build and
Lambda package, and `pnpm run mobile:export` when an Expo iOS bundle export is needed.
Use Node 22.13 or newer; `.nvmrc` pins the development version.

Turborepo runs workspace tasks, caching `build` and `build-storybook` outputs
and typecheck results. Use `pnpm run dev:web`, `pnpm run dev:api`, or
`pnpm run dev:mobile` for one app; `pnpm run check`, `pnpm run typecheck`, and
`pnpm run build-storybook` for their respective checks. Add an app dependency
with `pnpm --filter <workspace> add <package>`. CI uses
`pnpm install --frozen-lockfile` from the repository root.

Vite serves http://localhost:5173 and proxies `/api` + `/m` to the local API
(port 3001), which uses your AWS credentials against the **dev** table/bucket/params.
Mint a test session: `AWS_REGION=us-west-2 pnpm --filter memeon-api exec tsx scripts/mint-test-session.ts you "Your Name"`.

## Web UI

`web/` is a headless, tiered React app. Read [`web/src/Anatomy.mdx`](web/src/Anatomy.mdx)
before touching it; the short version:

| | |
| --- | --- |
| Tiers | `atoms → molecules → organisms → screens → views` under `web/src/`. Everything below `views/` is pure props → markup with a `data-slot` on its root and a sibling `*.stories.tsx`. |
| State | `hooks/useXScreen()` per screen (exports the screen's model type and builds its copy), XState machines in `stores/*Machine.ts`, MobX for the auth/theme stores and the actor snapshot projection. Prop-bag builders (`lib/*Model.ts`) sit between API records and components. |
| Styling | Tailwind v4 with **no config file**: every token is `@theme static` in `web/src/index.css`, each colour a `light-dark()` pair, resolved by `color-scheme` (`stores/themeStore.ts` pins `data-theme` on `<html>`). Utilities on the component, merged with `cn()` (`lib/cn.ts`, which must learn any new `@theme` namespace). Co-located `.css` only for effects a utility cannot express (`atoms/foil.css`, …), each restating the layer order. |
| Behaviour primitives | Base UI (`@base-ui/react`) for dialogs, menus, popovers, select, toggles; painted with utilities, state read from `data-*` attributes. |
| Storybook | `pnpm run storybook` (port 6006, MSW-backed connected scenarios in `web/.storybook/`). Every component has a story; view stories drive real hooks against mocked `/api`. `Anatomy/Tokens` renders the whole token sheet. |
| Gates | `pnpm run check` = `check-tiers` (tier/import/state rules), `check-copy` (strings outside `web/src/copy/` may only shrink), `check-contrast` (APCA on every text/surface pair, both arms), `check-layers` (cascade order in `dist`), proxy, unit, runtime (Playwright) and story tests. `pnpm run build` runs `check-tiers`, `tsc`, Vite and `check-layers`. Unused code: `pnpm exec knip`. |
| Shared code | `shared/tiers.ts` is imported as `@memeon/shared/tiers` (a `workspace:*` package). |

The "Making a change" table in `Anatomy.mdx` says which file a copy, style, state,
route or token change lands in.

## Firebase

Project `memeon-8ab5f`: RTDB (`https://memeon-8ab5f-default-rtdb.firebaseio.com`)
powers online presence in Friends (`presence/{uid}`, rules deployed by
`api/scripts/deploy-rtdb-rules.ts`). The API mints custom tokens from the service
account in SSM — **Authentication must be enabled once in the Firebase console**
(Build → Authentication → Get started) for sign-in to succeed; until then the app
works with presence silently disabled.
