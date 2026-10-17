# memeon-alerts bridge

Posts CloudWatch alarm transitions into the Buzz channel **#memeon-alerts**
(`c15a253c-9587-4fa2-bd66-1a374afcce4f` on `wss://buzz.masky.ai`).

Pipeline: Lambda/API-GW logs → metric filter (`$.level = "ERROR"` / gateway
5xx) → CloudWatch alarm → SNS `memeon-alerts` → this Lambda
(`memeon-alerts-bridge`, us-west-2) → signed kind-9 relay event. ALARM
transitions include the most recent matching log lines; OK transitions post a
"resolved" note. 4xx are logged at WARN by `api/src/handler.ts` — visible in
CloudWatch, but only ERROR pages.

## Identity

The bridge signs as a dedicated bot key (not a person, not an agent session):

- `SSM /memeon/alerts/nostr-key` — bot private key (SecureString)
- `SSM /memeon/alerts/auth-tag` — NIP-OA owner attestation
  `["auth", <owner>, "", <sig>]`, where sig = owner's Schnorr signature over
  `SHA256("nostr:agent-auth:<bot-pubkey>:")`. The Buzz relay rejects writes
  without it. Mint/rotate with `node mint-auth-tag.mjs` (prompts for the owner
  key; writes the tag to SSM — run `npm i` here first).

Bot pubkey: `cd62290aee29a999c8088090d5f00c871099447d17a1be03a3e31a2d41d3396d`
(a member of #memeon-alerts).

## Deploy

```sh
npm install
npm run bundle
cd dist && zip bridge.zip index.mjs
aws lambda update-function-code --function-name memeon-alerts-bridge \
  --zip-file fileb://bridge.zip --region us-west-2
```

Terraform mirror: `../terraform/alerting.tf` (prod) and the dev stage/alarm
additions in `../terraform/dev/main.tf`.
