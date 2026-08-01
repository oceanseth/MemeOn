---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Your meme is an asset that levels up"
destination: embed
aspect: 1920x1080
language: en
length: 50s
angle: mechanic-first
---

## Intent

The hero video for memeon.ai's own landing page. MemeOn is the meme trading card
market: you mint a meme, it becomes a 100-share collectible, and its card frame
physically levels up through pokemon-style foil tiers as the link gets reshared —
Paper → Silver → Holo → Chrome → Gold → Prismatic → ✨Shiny✨.

Three pillars the user named, in order: **the memes**, **their virality**, and
**what you can do on the site**. The rarity ladder is the hook because it is the
one mechanic no other product has; the three verbs (mint, invest, trade) follow it
as payoff, not as a feature list.

Tone: internet-native and a little unserious — this is a product that calls its
currency "braincells" and its leaderboard "Top Brains". Confident, fast, funny.
Never corporate SaaS.

## Assets

- assets/memes/ — real, currently-viral memes pulled from the web (user's explicit
  ask: "use the most viral memes in the world right now, even if they aren't on
  memeon"). Kept in their own folder with a source manifest so they can be swapped
  for MemeOn-native memes later without touching the composition.
- capture/ — headless capture of the local dev app at http://localhost:5174.

## Customizations

- Interior product screens (Marketplace, My Binder, Trade) are built as designed
  mock-UI from the real React components and the real tier tokens in
  `shared/tiers.ts` — the app is behind Masky SSO, so a headless crawl cannot
  reach them and no real user data goes on camera. Confirmed by the user as
  option (a).
- The tier ladder's own colors drive the palette: paper `#a8b0bd`, silver
  `#c8d3e0`, holo `#7fd4ff`, chrome `#b8c6ff`, gold `#ffd76a`, prismatic
  `#ff9af5`, shiny. The climb from matte grey to prismatic IS the film's arc.

## Notes

- Source of truth for tier names, rarity labels, reshare thresholds, base values,
  colors, and hype copy is `shared/tiers.ts` — never invent tier numbers.
- Real product facts: 100 shares per meme; currency is braincells 🧠; login is
  Masky SSO (avatar-only identity, real identity stays masked); AI meme generation
  bills the user's own Masky credits.
- IP flag raised with the user: the pulled viral memes are third-party
  copyrighted images and this is a commercial promo. User chose to proceed; the
  separate `assets/memes/` folder + manifest keeps them swappable.
- HeyGen not signed in at Setup; Kokoro and MusicGen deps missing. **Resolved:** the
  user redirected narration to the **Masky API** (`https://masky.ai/api`), which is
  also what MemeOn itself runs on. Voice: *Casual Podcast Host*
  (`33045fd9-8010-43f6-b6b0-da3fbf326c29`), via `POST /conversations/{id}/turn` with
  `mode: speak, output: audio`. Word timings come from local whisper
  (`hyperframes transcribe`), not the TTS provider.
- The Masky token was supplied in chat and is being **rotated after this run** — it is
  passed via the `MASKY_API_KEY` env var only and never written into any file here.
- **Masky chunks long lines into separate turns.** Line 5 (the centerpiece, 95 chars)
  came back split in two, silently dropping the climax on the first attempt. It is now
  generated as two takes stitched with a 0.45s gap. Any future line edit must be
  re-verified against the returned `avatarText`, not assumed.
- `length` moved 45s → 50s: real measured VO is 49.99s. No BGM yet (`bgm: null`).

## Build gotchas hit on this run (read before editing frames)

1. **A sub-composition's `<script>` must live INSIDE the composition root div**, not
   after the `</template>`. Outside it, the script executes before the runtime clones
   the template, every selector misses, and the frame renders as static HTML with no
   error anywhere — lint, check and transitions-verify all pass clean. This silently
   froze all 8 frames on the first build.
2. **Only these properties animate:** `opacity, x, y, scale, scaleX, scaleY, rotation,
   width, height, visibility` (`hyperframes docs gsap`). `autoAlpha`, `rotateY`,
   `backgroundColor`, `color`, `filter`, `xPercent` and `transformPerspective` are
   silently dropped. Counters therefore use pre-rendered stacked values toggled by
   `opacity` rather than a tweened plain object.
3. **`.format()` does not unescape braces inside a substituted value** — `BASE_CSS` is
   `%`-formatted and must use single braces, or `{{` leaks into the CSS and kills the
   whole style block (light ground, serif fallback).
4. **`assets/frames/shiny.png` downloaded truncated** the first time (758KB, valid
   header, incomplete pixel data) and rendered as a thin strip. Verify tier art with
   `PIL.Image.load()` after fetching, not just a size check.
5. Element ids may not start with a digit — `#01-hook-x` throws in `querySelector`.
   Authored ids are prefixed `f` (`#f01-hook-x`); `data-composition-id` stays raw.

Rebuild everything with: `python3 /tmp/build_frames2.py && bash /tmp/finish_build.sh`
(both scripts are session-local; copy them into the project if this needs to outlive
the session).
