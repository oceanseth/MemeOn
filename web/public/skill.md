# MemeOn API skill

MemeOn (https://memeon.ai) is a meme trading card market. Each meme is a card
with 100 shares. Rarity tier (Paper, Silver, Holo, Chrome, Gold, Prismatic,
Shiny) rises with views of the meme's share link. Users trade shares with
"braincells", a play currency with no monetary value.

Base URL: https://memeon.ai/api. All request/response bodies are JSON.
Canonical copy of this file: https://memeon.ai/.well-known/skill.md

## Auth

Two ways to act as a MemeOn account:

1. Developer API key: account owner generates one at https://memeon.ai/developers
   (prefix `mk_`, shown once, max 5 per account). Send as
   `Authorization: Bearer mk_...`. The key acts as that account: mint, gift,
   trade, read.

2. Masky SSO hand-off: if your site uses Masky SSO (https://masky.ai/skill.md),
   you know your users' `avatar_id` from the userinfo endpoint. Masky `sub`
   values are per-site pseudonyms and do NOT transfer between sites; `avatar_id`
   is global. MemeOn endpoints that accept `avatarId` can reference any avatar
   that has logged into MemeOn at least once.

## Memes

```bash
# browse (optional params: q, type=image|video, tier, listed=true)
curl -s "https://memeon.ai/api/memes?q=doge" -H "Authorization: Bearer mk_..."

# one meme + its cap table
curl -s https://memeon.ai/api/memes/MEME_ID

# mint a new card (title <= 20 chars; creator gets all 100 shares)
curl -s -X POST https://memeon.ai/api/memes \
  -H "Authorization: Bearer mk_..." -H "Content-Type: application/json" \
  -d '{"title":"Business Pigeon","imageUrl":"https://.../img.png","tags":["birds"]}'
# video meme: add "mediaType":"video","videoUrl":"https://.../clip.mp4"
# remix provenance: add "remixOf":"SOURCE_MEME_ID"
```

Share URL: `https://memeon.ai/m/{id}`. Each load counts a view (tier fuel);
each distinct referrer counts a reshare. The link unfurls the current
tier-frame card image.

- `GET /api/memes/{id}/stats` -> `{views, reshares, sources[]}`
- `GET /api/memes/{id}/history` -> value-over-time points
- `GET /api/memes/{id}/memeplex` -> remix ancestry + related memes
- `POST /api/memes/{id}/list` `{pricePerShare, shares}` / `POST .../unlist`
- `POST /api/memes/{id}/buy` `{shares}` (spends braincells)

## Gifting shares

Transfer shares you hold to any user. Free; no braincells involved.

```bash
curl -s -X POST https://memeon.ai/api/gift \
  -H "Authorization: Bearer mk_..." -H "Content-Type: application/json" \
  -d '{"memeId":"MEME_ID","shares":10,"avatarId":"AVATAR_ID_FROM_MASKY"}'
# or target a MemeOn account directly: {"memeId":"...","shares":10,"toSub":"ava_..."}
# 404 "not joined yet" -> that avatar has never logged into MemeOn
```

The recipient gets an alert. This is the cross-site primitive: your site can
reward its users with meme shares knowing only their Masky avatar id.

## Social + market reads

- `GET /api/me` - your account (braincells, portfolio, onboarding)
- `GET /api/feed?cursor=0&limit=10` - binder/friends-prioritized feed
- `GET /api/leaderboard` - top braincell holders
- `GET /api/users/{sub}/profile` - a user's created memes + binder
- `POST /api/users/{sub}/follow` / `unfollow`
- `GET /api/trades`, `POST /api/trades` `{toId, offer:{memes:[{memeId,shares}],coins}, ask:{...}}`,
  `POST /api/trades/{id}/respond` `{action:"accept"|"decline"|"cancel"}`
- `GET /api/alerts`, `POST /api/alerts/read` `{ids}`

## Notes

- Braincells are earned in-app (onboarding quests, sales); they cannot be
  bought or cashed out. Trades and purchases are final.
- Meme generation from prompts runs on the user's Masky credits and requires
  their Masky OAuth token (`x-masky-token` header on `/api/aigen/*`). An API
  key alone cannot spend anyone's Masky credits.
- Rate-limit courtesy: cache reads; the feed and marketplace change slowly.
- Terms: https://memeon.ai/terms | Privacy: https://memeon.ai/privacy
- Discord app: https://memeon.ai/discord
