# MemeOn! for Chrome

Hover over an image on a website and press **Alt+Shift+M** (Option+Shift+M on Mac).
The brain-logo **MemeOn!** button appears beside your signed-in avatar. Click it to
open MemeOn's mint desk with the image in **Upload**. Add your title and edits, then
mint when ready. The extension never mints automatically.

If signed out, MemeOn! is disabled and **Log in** opens your MemeOn tab. Complete
normal Masky login there, return to the original page, and the overlay enables.
Escape, the close button, an outside click, or the shortcut again dismisses it.

## Install

1. Extract the supplied `memeon-chrome-extension.zip` into a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked**, then select the extracted folder containing `manifest.json`.
4. Refresh any already-open website tabs. Allow site access on the sites where you
   want to use MemeOn (all sites supports the shortcut throughout the web).
5. Hover an image and press **Alt+Shift+M**. If Chrome or your OS already uses that
   combination, set another at `chrome://extensions/shortcuts`.

This is an unpacked extension, not a Chrome Web Store listing. Keep its folder in
place. To update it, replace the extracted files and click Reload on its extension
card, then refresh website tabs.

## Build and test

From the repository root, using the normal `pnpm install --frozen-lockfile` setup:

```sh
node extension/scripts/build.mjs
node --test extension/tests/*.test.mjs
node extension/tests/browser.mjs
pnpm exec biome check extension
```

Load `extension/dist/production` for **memeon.ai**. Build with `--dev` and load
`extension/dist/dev` for **dev.memeon.ai** instead. Accounts stay scoped to that
origin. The source directory itself also loads directly and defaults to production.

The browser suite launches isolated Chromium with the real Manifest V3 extension
and starts the actual app using `pnpm run dev:web`. Ports 5173 and 4178 must be free.
It uses fixture login/API/upload responses: no real account, credits, or minting.
It verifies Chrome's shortcut registration, invokes the registered command handler,
and uses trusted browser pointer clicks for the rest of the flow. OS keyboard
shortcut delivery and live Masky OAuth are manual smoke checks. Screenshots and the
Vite log are written to `extension/test-results/`.

## Supported images and limits

- `img`/`picture` and the selected `srcset` source, including lazy-loaded images
  once displayed; CSS `url(...)` backgrounds; SVG image references; inline SVG;
  image inputs; open shadow roots; and HTTP(S) frames.
- Data/blob URLs and readable canvas images. Inline SVG/canvas are copied as PNG.
  PNG, JPEG, GIF, and WebP downloads retain their original bytes; other formats are
  converted to PNG when the browser can decode them. The upload limit is 8 MB.
- Chrome blocks extensions on its internal pages, the Chrome Web Store, and some
  built-in viewers. Closed shadow roots, tainted/protected canvas contents, expired
  blob URLs, and servers that refuse image downloads cannot always be copied.
  Failures leave an actionable error in the overlay; save the image and use Upload
  manually when the source site prevents copying.

## Privacy and permissions

`http://*/*` and `https://*/*` let the content script track the pointer locally and
find the selected DOM image when the shortcut is pressed, including in frames.
Host permissions also let the worker download cross-origin images when page CORS
blocks them. `scripting` reads the profile in MemeOn's isolated script world and
chooses the frame under the pointer. `activeTab` supports user-triggered activation.
`storage` holds only a random browser-session identifier in trusted session storage.

Login tokens remain in MemeOn's local storage and are used only there to call its
same-origin `/api/me`. Only the public subject, display name, and avatar URL leave
that check. The extension does not read or persist the Masky access token. If no
MemeOn tab is open, asking for the overlay opens one in the background to check
login. While the overlay is visible, login is refreshed every five seconds and
when returning to the page; a click rechecks it before opening a mint desk.

Only after you click MemeOn! is the selected image copied. Same-origin protected
images may be fetched in the source page with its own cookies; worker downloads
omit cookies and referrers. The image is temporarily stored in extension IndexedDB,
bound to the destination tab, account, and browser session. It is deleted on handoff,
dismissal, or tab closure. Unclaimed records become unusable after ten minutes and
are pruned on the next operation/worker start. No analytics, browsing-history log,
remote code, cookie permission, or clipboard permission is used.

The site adapter is `bridge.js`: it selects the existing Upload mode, fills its
image file input, and dispatches the normal change event. It does not call a mint
endpoint. Keep the browser integration test green when changing the mint desk's
`data-slot` markers or Upload label. No server or website deployment is required.
