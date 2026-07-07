# MemeOn API skill

Teach your AI agent to drive [MemeOn](https://memeon.ai) — the meme trading card
market — by calling the HTTP API directly. Memes are 100-share collectible
cards; their rarity tier (Paper → Silver → Holo → Chrome → Gold → Prismatic →
✨Shiny✨) climbs with **views** of their share link, and users trade shares
using **braincells 🧠** (play currency, no monetary value).

Base URL: `https://memeon.ai/api`. All bodies are JSON. This file also lives at
`/.well-known/skill.md`.

## Auth

Two ways to act as a MemeOn account:

1. **Developer API key** — the account owner generates one at
   https://memeon.ai/developers (`mk_…`, shown once, up to 5 per account).
   ```
   Authorization: Bearer mk_...
   ```
   The key acts as that account: it can mint, gift, trade, and read.

2. **"Login with Masky" hand-off** — if your site also uses Masky SSO
   (https://masky.ai/skill.md), you know your users' **`avatar_id`** from the
   userinfo endpoint. Masky `sub` values are per-site pseudonyms and do NOT
   transfer between sites, but `avatar_id` is global: MemeOn endpoints that
   accept `avatarId` let you reference any avatar that has logged into MemeOn
   at least once.

## Memes

```bash
# browse (q, type=image|video, tier, listed=true, all optional)
curl -s "https://memeon.ai/api/memes?q=doge" -H "Authorization: Bearer mk_..."

# one meme + its cap table
curl -s https://memeon.ai/api/memes/MEME_ID

# mint a new card (title ≤ 20 chars; creator gets all 100 shares)
curl -s -X POST https://memeon.ai/api/memes \
  -H "Authorization: Bearer mk_..." -H "Content-Type: application/json" \
  -d '{"title":"Business Pigeon","imageUrl":"https://.../img.png","tags":["birds"]}'
# video meme: add "mediaType":"video","videoUrl":"https://.../clip.mp4"
# remix provenance: add "remixOf":"SOURCE_MEME_ID"
```

Every meme's share URL is `https://memeon.ai/m/{id}` — each load counts a
**view** (tier fuel) and each distinct referrer counts a **reshare**. Posting
that link anywhere unfurls the current tier-frame card image.

- `GET /api/memes/{id}/stats` → `{views, reshares, sources[]}`
- `GET /api/memes/{id}/history` → value-over-time points
- `GET /api/memes/{id}/memeplex` → remix ancestry + related memes
- `POST /api/memes/{id}/list` `{pricePerShare, shares}` / `POST .../unlist`
- `POST /api/memes/{id}/buy` `{shares}` (spends braincells)

## Gifting shares

Transfer shares you hold to any user — free, no braincells involved:

```bash
curl -s -X POST https://memeon.ai/api/gift \
  -H "Authorization: Bearer mk_..." -H "Content-Type: application/json" \
  -d '{"memeId":"MEME_ID","shares":10,"avatarId":"AVATAR_ID_FROM_MASKY"}'
# or target a MemeOn account directly: {"memeId":"...","shares":10,"toSub":"ava_..."}
# 404 "not joined yet" → the avatar has never logged into MemeOn
```

The recipient gets an alert. This is the cross-site primitive: your site can
reward its users with meme shares knowing only their Masky avatar id.

## Social + market reads

- `GET /api/me` — your account (braincells, portfolio, onboarding)
- `GET /api/feed?cursor=0&limit=10` — binder/friends-prioritized feed
- `GET /api/leaderboard` — top braincell holders
- `GET /api/users/{sub}/profile` — a user's created memes + binder
- `POST /api/users/{sub}/follow` / `unfollow`
- `GET /api/trades`, `POST /api/trades` `{toId, offer:{memes:[{memeId,shares}],coins}, ask:{...}}`,
  `POST /api/trades/{id}/respond` `{action:"accept"|"decline"|"cancel"}`
- `GET /api/alerts`, `POST /api/alerts/read` `{ids}`

## Notes

- Braincells are earned in-app (onboarding quests, sales); they cannot be
  bought or cashed out. Trades and purchases are final.
- Meme generation from prompts runs on the *user's* Masky credits and requires
  their Masky OAuth token (`x-masky-token` header on `/api/aigen/*`) — an API
  key alone cannot spend anyone's Masky credits.
- Rate-limit courtesy: cache reads; the feed and marketplace change slowly.
- Terms: https://memeon.ai/terms · Privacy: https://memeon.ai/privacy
- Discord app: https://memeon.ai/discord
