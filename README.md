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
- `web/` – React + Vite SPA: Landing/FAQ (tier showcase), Marketplace (filters +
  search), My Binder (collection + mint via Masky image/video gen), Friends
  (requests, portfolio stats, RTDB online presence), Trade (propose/respond/history),
  meme detail with cap table, listing, buying, share link.
- `api/` – Lambda (esbuild-bundled) + Express dev bridge. DynamoDB single-table,
  Masky OAuth + aigen proxy, session JWTs, og pipeline (jimp), alerts.
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
npm install
npm run dev
```

Vite serves http://localhost:5173 and proxies `/api` + `/m` to the local API
(port 3001), which uses your AWS credentials against the **dev** table/bucket/params.
Mint a test session: `cd api && AWS_REGION=us-west-2 npx tsx scripts/mint-test-session.ts you "Your Name"`.

## Firebase

Project `memeon-8ab5f`: RTDB (`https://memeon-8ab5f-default-rtdb.firebaseio.com`)
powers online presence in Friends (`presence/{uid}`, rules deployed by
`api/scripts/deploy-rtdb-rules.ts`). The API mints custom tokens from the service
account in SSM — **Authentication must be enabled once in the Firebase console**
(Build → Authentication → Get started) for sign-in to succeed; until then the app
works with presence silently disabled.
