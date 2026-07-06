# MemeOn mobile (Expo / React Native)

TikTok-style meme feed: infinite vertical scroll prioritized by what your friends
own or have liked, ❤️ like (button or double-tap), **swipe left to pass** (never
shown again), **swipe right to invest** — value-over-time chart, cap table, buy
from listing, coin buy-offers and share-for-share trade offers (both delivered as
trade proposals), and creator profiles (follow / friend request, their created
memes + binder).

Talks to the same API as the web app. `app.json → extra.apiBase` selects the
backend (default `https://dev.memeon.ai`; point at `https://memeon.ai` for prod
builds). Masky login opens the system browser and returns via the
`https://{apiBase}/auth/mobile` → `memeon://auth` deep-link hop.

## Run it

```
cd mobile
npm install
npx expo start        # scan QR with Expo Go, or press i / a for simulators
```

Note: `memeon://` deep links don't resolve to Expo Go, so Masky login requires a
dev build (`npx expo run:ios` / `run:android` or an EAS development build).

## Ship it to the stores

One-time setup:

```
npm i -g eas-cli
eas login                       # expo.dev account
eas init                        # links the project (writes extra.eas.projectId)
```

**iOS (App Store):**

```
eas build --platform ios --profile production     # needs Apple Developer account login
eas submit --platform ios                          # uploads to App Store Connect
```

**Android (Google Play):**

```
eas build --platform android --profile production  # produces an .aab
eas submit --platform android                       # needs a Play service-account JSON once
```

Bundle ids are already set: `ai.memeon.app` on both platforms. For the first Play
submission you must create the app in the Play Console and upload the first .aab
manually; `eas submit` handles it after that.
