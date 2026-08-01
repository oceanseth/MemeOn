# Pulled meme assets — provenance

These are **third-party meme images**, pulled at the user's explicit request ("use the
most viral memes in the world right now, even if they aren't on memeon"). They are NOT
MemeOn-native content.

Source: the [Imgflip popular-templates API](https://api.imgflip.com/get_memes), which
ranks meme templates by current usage volume. Fetched 2026-08-01.

| File | Meme | Imgflip rank | Origin URL |
| --- | --- | --- | --- |
| `disaster-girl.jpg` | Disaster Girl | 18 | https://i.imgflip.com/23ls.jpg |
| `drake.jpg` | Drake Hotline Bling | 1 | https://i.imgflip.com/30b1gx.jpg |
| `distracted-boyfriend.jpg` | Distracted Boyfriend | 3 | https://i.imgflip.com/1ur9b0.jpg |
| `two-buttons.jpg` | Two Buttons | 2 | https://i.imgflip.com/1g8my4.jpg |
| `trade-offer.jpg` | Trade Offer | 21 | https://i.imgflip.com/54hjww.jpg |
| `bernie-asking.jpg` | Bernie: I Am Once Again Asking | 4 | https://i.imgflip.com/3oevdk.jpg |
| `running-away-balloon.jpg` | Running Away Balloon | 11 | https://i.imgflip.com/261o3j.jpg |
| `change-my-mind.jpg` | Change My Mind | 15 | https://i.imgflip.com/24y43o.jpg |
| `mocking-spongebob.jpg` | Mocking Spongebob | 23 | https://i.imgflip.com/1otk96.jpg |

## ⚠️ Rights status — read before publishing

Every image above is **someone else's copyrighted work**, and this video is a commercial
promo for memeon.ai. Meme templates are widely reshared, but that is not a licence:

- **Disaster Girl** — the photographer's family sold the original as an NFT for ~$500k;
  actively rights-managed.
- **Distracted Boyfriend** — a licensed **stock photograph** (Antonio Guillem); stock
  agencies have pursued commercial reuse before.
- **Drake Hotline Bling** — frames from a copyrighted music video.

This folder is deliberately isolated and every reference in the composition points at
`assets/memes/<file>`, so swapping in MemeOn-native memes is a file-drop — no storyboard
or composition edits required. Get a rights review before this goes on the live landing page.

## Card geometry (from `api/src/og.ts` — the real product pipeline)

Frames are `900×1200`. The meme is `cover`-fit into a **720×720 window at (90, 216)** and
composited **on top of** the frame art. As percentages of the card:

- window: `left 10%` · `top 18%` · `width 80%` · `height 60%` · `object-fit: cover`

Title banner: `x 110`, `w 680`; vertical center is per-tier (paper 1008, silver 1012,
holo 1032, chrome 981, gold 1034, prismatic 1039, shiny 1001).
