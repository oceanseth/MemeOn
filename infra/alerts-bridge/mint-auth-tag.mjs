// Mint the NIP-OA owner attestation for the memeon-alerts bridge bot.
// Run by the WORKSPACE OWNER (Seth): node mint-auth-tag.mjs
// Prompts for the owner private key (nsec or hex) on stdin — nothing is
// stored; it signs "nostr:agent-auth:<bot-pubkey>:" and writes the resulting
// ["auth", owner, "", sig] tag into SSM /memeon/alerts/auth-tag (us-west-2).
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { execFileSync } from 'node:child_process'
import { schnorr } from '@noble/curves/secp256k1.js'

const BOT_PUBKEY = 'cd62290aee29a999c8088090d5f00c871099447d17a1be03a3e31a2d41d3396d'

function bech32Decode(str) {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const pos = str.lastIndexOf('1')
  const data = [...str.slice(pos + 1)].map((c) => CHARSET.indexOf(c))
  if (data.includes(-1)) throw new Error('bad bech32')
  const words = data.slice(0, -6)
  let acc = 0, bits = 0
  const out = []
  for (const w of words) {
    acc = (acc << 5) | w
    bits += 5
    while (bits >= 8) { bits -= 8; out.push((acc >> bits) & 0xff) }
  }
  return Buffer.from(out)
}

const rl = createInterface({ input: process.stdin, output: process.stderr })
const raw = (await rl.question('Owner private key (nsec1... or 64-char hex): ')).trim()
rl.close()

const privHex = raw.startsWith('nsec1') ? bech32Decode(raw).toString('hex') : raw.toLowerCase()
if (!/^[0-9a-f]{64}$/.test(privHex)) throw new Error('could not parse private key')
const priv = Uint8Array.from(Buffer.from(privHex, 'hex'))
const ownerPub = Buffer.from(schnorr.getPublicKey(priv)).toString('hex')

const preimage = `nostr:agent-auth:${BOT_PUBKEY}:`
const digest = createHash('sha256').update(Buffer.from(preimage, 'utf8')).digest()
const sig = Buffer.from(schnorr.sign(digest, priv)).toString('hex')
const tag = JSON.stringify(['auth', ownerPub, '', sig])

console.error(`owner pubkey: ${ownerPub}`)
console.error(`auth tag: ${tag}`)
execFileSync('aws', ['ssm', 'put-parameter', '--region', 'us-west-2',
  '--name', '/memeon/alerts/auth-tag', '--type', 'String', '--value', tag, '--overwrite'],
  { stdio: ['ignore', 'inherit', 'inherit'] })
console.error('SSM /memeon/alerts/auth-tag updated — bridge is live.')
