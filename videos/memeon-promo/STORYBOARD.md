---
format: 1920x1080
duration: 50s
message: "Your meme is an asset that levels up"
arc: Future Pacing — proof → pain → mint → mechanism → the climb → invest → trade → CTA
audience: meme-literate internet people landing on memeon.ai
mode: collaborative
music: playful-tense-electronic
---

## Frame 1 — Half a million dollars

- scene: Disaster Girl fills the frame; $473,000 counts up over her
- duration: 6.144s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- blueprint: dataviz-countup
- voiceover: "In 2021, this photo sold for four hundred seventy-three thousand dollars."
- asset_candidates: assets/memes/disaster-girl.jpg
- narrativeRole: hook — one exploding stat, no product yet

Cold open on the single meme that already proved the thesis. No logo, no product, no
explanation — just the most famous meme in the world and a number climbing over it. The
number IS the tension: everyone watching has shared this image and made nothing from it.

Value-first: the hook is in outcome language (money a meme made), never a feature.

## Frame 2 — You just don't own it

- scene: The meme collapses to a small tile; the line lands in beats on empty dark field
- duration: 4.392s
- transition_in: cut
- status: animated
- src: compositions/frames/02-pain.html
- blueprint: kinetic-type-beats
- voiceover: "Your memes travel just as far. You just never owned any of it."
- asset_candidates: assets/memes/drake.jpg, assets/memes/distracted-boyfriend.jpg, assets/memes/mocking-spongebob.jpg
- narrativeRole: pain_point — validate the pain, still no product

The turn. Familiar memes flick past small and unowned while the line lands in two hard
beats. This is the only frame in the film that is about lack; everything after is payoff.

## Frame 3 — Mint it

- scene: A bare meme snaps into a Paper card — the frame builds around it
- duration: 5.664s
- transition_in: cut
- status: animated
- src: compositions/frames/03-mint.html
- blueprint: logo-assemble-lockup
- voiceover: "MemeOn turns it into a trading card. One share link. A hundred shares."
- asset_candidates: assets/memes/disaster-girl.jpg, capture/assets/paper-frame.png
- handoff_out: card — centered, x 960 y 540, scale 1.0, opacity 1, at rest (no drift)
- narrativeRole: product_intro — the message lands by beat 3

The product arrives as a physical act: the meme the viewer has been staring at gets a
card built around it. Paper tier, matte cardboard, worth exactly nothing yet — that
"yet" is the whole rest of the film. Real `paper-frame.png`, real 720×720 window.

## Frame 4 — Every reshare counts

- scene: The share link duplicates outward; a reshare counter starts ticking
- duration: 7.344s
- transition_in: cut
- status: animated
- src: compositions/frames/04-reshare.html
- blueprint: kinetic-type-beats
- voiceover: "Then people share it. Every unfurl, every click, every repost — it all counts."
- asset_candidates: capture/assets/paper-frame.png, assets/memes/disaster-girl.jpg
- handoff_in: card — centered, x 960 y 540, scale 1.0, opacity 1, at rest
- handoff_out: card — centered, x 960 y 540, scale 1.0, opacity 1, counter reading 0
- narrativeRole: feature_showcase — the mechanism, stated before it is shown

The rule of the game in one line, so the climb that follows reads as earned rather than
decorative. The card holds dead center and does not move — it is about to.

## Frame 5 — The climb

- scene: Reshare counter runs 0 → 25,000; the card's foil snaps up all seven tiers
- duration: 11.202s
- transition_in: cut
- status: animated
- src: compositions/frames/05-climb.html
- blueprint: dataviz-countup
- voiceover: "Ten reshares, silver. Fifty, holo. A thousand — gold foil. Twenty-five thousand? Mythic shiny."
- asset_candidates: capture/assets/paper-frame.png, capture/assets/silver-frame.png, capture/assets/holo-frame.png, capture/assets/chrome-frame.png, capture/assets/gold-frame.png, capture/assets/prismatic-frame.png, capture/assets/shiny-frame.png, assets/memes/disaster-girl.jpg
- handoff_in: card — centered, x 960 y 540, scale 1.0, opacity 1, counter reading 0
- narrativeRole: benefit_highlight — the centerpiece; the one polychrome event

**The money shot — the longest frame in the film and the reason it exists.** One card,
one meme, seven real foil frames. The counter is the engine: each real threshold from
`shared/tiers.ts` (0 / 10 / 50 / 250 / 1,000 / 5,000 / 25,000) SNAPS the foil to the next
tier on the number, never crossfades — the level-up should feel like a card flipping, not
a dissolve. Tier name + rarity stamp in mono chrome, in that tier's own color.

Pacing must accelerate then hold: paper→silver→holo quick, chrome→gold weightier, a beat
of stillness before prismatic→shiny so the last two land as events.

## Frame 6 — Own a piece

- scene: Marketplace mock-UI; a cap table splits one card into 100 shares
- duration: 6.552s
- transition_in: cut
- status: animated
- src: compositions/frames/06-invest.html
- blueprint: cursor-ui-demo
- voiceover: "Every meme is a hundred shares. Buy into the ones you believe in — before they tier up."
- asset_candidates: assets/memes/drake.jpg, assets/memes/two-buttons.jpg, assets/memes/bernie-asking.jpg, assets/memes/running-away-balloon.jpg, capture/assets/holo-frame.png
- narrativeRole: feature_showcase — pillar 3, part 1: invest

Designed mock-UI built from the real Marketplace components — no login, no real user
data. The cursor buys shares in a Holo card and the position appears. Prices in
braincells 🧠, the product's real currency. The "before they tier up" is the investment
thesis in five words.

## Frame 7 — Trade with friends

- scene: A trade panel — shares + braincells each way — accepted
- duration: 4.656s
- transition_in: cut
- status: animated
- src: compositions/frames/07-trade.html
- blueprint: comparison-split
- voiceover: "Trade positions with friends. Cash out on a legendary."
- asset_candidates: assets/memes/trade-offer.jpg, capture/assets/gold-frame.png, assets/memes/change-my-mind.jpg
- narrativeRole: feature_showcase — pillar 3, part 2: trade

The Trade Offer meme template is the literal UI metaphor and the product's real trade
shape: "I receive / You receive," shares and braincells on both sides. Two panels of
equal weight entering from opposite wings, badge-popped on accept.

## Frame 8 — memeon.ai

- scene: Cards fan out behind the wordmark; the Masky login button lands a click
- duration: 4.032s
- transition_in: cut
- status: animated
- src: compositions/frames/08-cta.html
- blueprint: cta-morph-press
- voiceover: "MemeOn dot A-I. Bring your best shitpost."
- asset_candidates: capture/assets/shiny-frame.png, capture/assets/gold-frame.png, capture/assets/prismatic-frame.png, assets/memes/disaster-girl.jpg
- narrativeRole: cta

The full ladder fans out as a hand of cards behind the gradient wordmark, then clears to
the real CTA — "🎭 Log in with Masky" — and a cursor lands the click. Sign-off is the
site's own voice (the Paper tier's hype copy literally reads "every legend starts as a
humble shitpost").
