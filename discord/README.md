# MemeOn for Discord 🧠

A user-installable Discord app that works like the GIF picker, but for MemeOn
cards: type `/memeon <search>` and pick from live results — **your binder and
your friends' memes rank above random public ones** once you connect your
account. Every card it posts is the meme's `/m/` share link, so it unfurls as
the current tier-frame card **and counts as a reshare**.

> Note: Discord doesn't allow third-party buttons inside the message input bar
> (Giphy lives there because Discord built it in). Slash commands with
> autocomplete are the sanctioned equivalent — the 🧠 icon appears as the app's
> avatar in the command picker and on every posted card.

## Commands

- `/memeon <query>` — autocomplete search (💼 = from your binder, 🤝 = friends'),
  posts the picked card into the channel.
- `/memeon-connect` — DM-safe (ephemeral) link to connect your MemeOn account
  via Masky login. Connect once; priority search follows you everywhere.

## One-time setup (app owner)

1. **Create the app**: [discord.com/developers/applications](https://discord.com/developers/applications)
   → New Application → name it `MemeOn`, upload the brain icon
   (`mobile/assets/icon.png` or the mascot from the assets bucket).
2. **Enable user installs**: Settings → Installation → check **User Install**
   (and Guild Install if you also want server-wide installs). Install link:
   leave as Discord Provided.
3. **Store the secrets** (from General Information / Bot pages):
   ```sh
   aws ssm put-parameter --region us-west-2 --type SecureString --overwrite \
     --name /memeon/production/discord \
     --value '{"application_id":"APP_ID","public_key":"PUBLIC_KEY","bot_token":"BOT_TOKEN"}'
   # repeat with --name /memeon/dev/discord for the dev stack
   ```
4. **Set the Interactions Endpoint URL** (General Information):
   `https://memeon.ai/api/discord/interactions` (dev app: `https://dev.memeon.ai/...`).
   Discord sends a signed PING on save — the endpoint must already have the SSM
   config from step 3 to pass verification.
5. **Register the slash commands**:
   ```sh
   ENV=production node discord/register-commands.mjs
   ```

## User install (what you put in the header link)

Share `https://discord.com/oauth2/authorize?client_id=APP_ID` — users click
**Add to My Apps** (or a server) and `/memeon` is available everywhere they
type. The site's `/discord` page (Discord icon in the header) walks users
through install + connect.

## How linking works

`/memeon-connect` → ephemeral link to `memeon.ai/discord/link?token=…` (a
1-hour HMAC token binding the Discord user id) → user logs in with Masky if
needed → the site posts the token back and the mapping `discord user ↔ memeon
account` is stored. No Discord OAuth scopes needed, nothing about your Discord
identity is exposed to other users.
