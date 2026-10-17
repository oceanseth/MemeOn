// memeon-alerts bridge: SNS (CloudWatch alarm) -> Buzz relay channel post.
//
// Identity: a dedicated bot keypair in SSM /memeon/alerts/nostr-key, with the
// owner-minted NIP-OA auth tag in /memeon/alerts/auth-tag. The Buzz relay
// (wss://buzz.masky.ai) requires that tag ON the kind-22242 AUTH event and on
// published events, and admits kind 9 channel messages.
//
// Relay publish logic mirrors Masky utils/agentBridge.js publishEvent(),
// which was raw-frame verified against this relay (2026-09-15).

import { createHash, randomBytes } from 'node:crypto'
import { schnorr } from '@noble/curves/secp256k1.js'
import WebSocket from 'ws'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

const RELAY_URL = process.env.RELAY_URL || 'wss://buzz.masky.ai'
const CHANNEL_ID = process.env.CHANNEL_ID || 'c15a253c-9587-4fa2-bd66-1a374afcce4f'
const PUBLISH_TIMEOUT_MS = 8000

// alarm name -> where to pull log excerpts from
const ALARM_SOURCES = {
  'memeon-api-errors': { group: '/aws/lambda/memeon-api', pattern: '{ $.level = "ERROR" }' },
  'memeon-api-dev-errors': { group: '/aws/lambda/memeon-api-dev', pattern: '{ $.level = "ERROR" }' },
  'memeon-apigw-5xx': { group: '/aws/apigateway/memeon-api-access', pattern: '{ $.status = "5*" }' },
}

const ssm = new SSMClient({})
const cwl = new CloudWatchLogsClient({})

let cachedIdentity = null
async function getIdentity() {
  if (cachedIdentity) return cachedIdentity
  const get = async (name, decrypt) =>
    (await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: decrypt }))).Parameter.Value
  const priv = (await get('/memeon/alerts/nostr-key', true)).trim()
  const authTagRaw = (await get('/memeon/alerts/auth-tag', false)).trim()
  if (!/^[0-9a-f]{64}$/.test(priv)) throw new Error('nostr-key SSM param is not a 64-char hex key')
  let authTag
  try { authTag = JSON.parse(authTagRaw) } catch { throw new Error('auth-tag SSM param is not JSON') }
  if (!Array.isArray(authTag) || authTag[0] !== 'auth') {
    throw new Error('auth-tag SSM param must be the NIP-OA ["auth", owner, conditions, sig] array (placeholder still in place?)')
  }
  cachedIdentity = { priv, authTag }
  return cachedIdentity
}

const sha256Hex = (data) => createHash('sha256').update(data).digest('hex')
const hexToBytes = (hex) => Uint8Array.from(Buffer.from(hex, 'hex'))

function signEvent(template, privHex) {
  const priv = hexToBytes(privHex)
  const pubkey = Buffer.from(schnorr.getPublicKey(priv)).toString('hex')
  const evt = { ...template, pubkey }
  evt.id = sha256Hex(Buffer.from(JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]), 'utf8'))
  evt.sig = Buffer.from(schnorr.sign(hexToBytes(evt.id), priv, randomBytes(32))).toString('hex')
  return evt
}

function publishEvent(relayUrl, evt, privHex, extraAuthTags) {
  return new Promise((resolve, reject) => {
    let settled = false
    let sends = 0
    let authed = false
    const done = (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { ws.close() } catch {}
      if (err) reject(err); else resolve()
    }
    const timer = setTimeout(() => done(new Error('relay publish timeout')), PUBLISH_TIMEOUT_MS)
    let ws
    try { ws = new WebSocket(relayUrl) } catch (e) { clearTimeout(timer); return reject(e) }
    const sendEvent = () => {
      sends += 1
      try { ws.send(JSON.stringify(['EVENT', evt])) } catch (e) { done(e) }
    }
    ws.on('open', sendEvent)
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (!Array.isArray(msg)) return
        if (msg[0] === 'AUTH' && typeof msg[1] === 'string' && !authed) {
          authed = true
          const authEvt = signEvent({
            kind: 22242,
            created_at: Math.floor(Date.now() / 1000),
            tags: [['relay', relayUrl], ['challenge', msg[1]], ...(extraAuthTags || [])],
            content: '',
          }, privHex)
          ws.send(JSON.stringify(['AUTH', authEvt]))
          if (sends < 3) sendEvent()
          return
        }
        if (msg[0] === 'OK' && msg[1] === evt.id) {
          if (msg[2] === true) return done()
          const reason = String(msg[3] || 'unknown reason')
          if (/^auth-required/i.test(reason) && sends < 3) {
            if (authed) sendEvent()
            return
          }
          done(new Error(`relay rejected event: ${reason}`))
        }
      } catch {}
    })
    ws.on('error', (e) => done(new Error(`relay connection failed: ${e.message}`)))
    ws.on('close', () => done(new Error('relay closed before acknowledging event')))
  })
}

async function recentExcerpts(alarmName, sinceMs) {
  const src = ALARM_SOURCES[alarmName]
  if (!src) return []
  try {
    const res = await cwl.send(new FilterLogEventsCommand({
      logGroupName: src.group,
      filterPattern: src.pattern,
      startTime: sinceMs,
      limit: 5,
    }))
    return (res.events || []).slice(-3).map((e) => {
      let line = e.message.trim()
      // Lambda JSON log format: surface the app payload, not the envelope
      try {
        const o = JSON.parse(line)
        if (o.message !== undefined) line = typeof o.message === 'string' ? o.message : JSON.stringify(o.message)
      } catch {}
      return line.length > 400 ? `${line.slice(0, 400)}…` : line
    })
  } catch (e) {
    console.warn('excerpt fetch failed', alarmName, e.message)
    return []
  }
}

function formatAlarm(a, excerpts) {
  const toAlarm = a.NewStateValue === 'ALARM'
  const head = toAlarm ? `🚨 **${a.AlarmName}**` : `✅ **${a.AlarmName}** resolved`
  const lines = [head]
  if (toAlarm && a.AlarmDescription) lines.push(a.AlarmDescription)
  lines.push(`state: ${a.OldStateValue} → ${a.NewStateValue} at ${a.StateChangeTime}`)
  if (toAlarm) lines.push(`reason: ${a.NewStateReason}`)
  if (excerpts.length) {
    lines.push('recent matching log lines:')
    lines.push('```')
    for (const x of excerpts) lines.push(x)
    lines.push('```')
  }
  const src = ALARM_SOURCES[a.AlarmName]
  if (toAlarm && src) lines.push(`logs: \`aws logs tail '${src.group}' --since 30m --region us-west-2\``)
  return lines.join('\n')
}

export { signEvent, publishEvent }

export async function handler(event) {
  const { priv, authTag } = await getIdentity()
  for (const record of event.Records || []) {
    let alarm
    try { alarm = JSON.parse(record.Sns.Message) } catch {
      console.warn('non-alarm SNS message, forwarding raw')
      alarm = null
    }
    let content
    if (alarm && alarm.AlarmName) {
      const sinceMs = Date.now() - 10 * 60 * 1000
      const excerpts = alarm.NewStateValue === 'ALARM' ? await recentExcerpts(alarm.AlarmName, sinceMs) : []
      content = formatAlarm(alarm, excerpts)
    } else {
      content = `⚠️ memeon-alerts received a non-alarm message:\n\`\`\`\n${String(record.Sns.Message).slice(0, 1000)}\n\`\`\``
    }
    const evt = signEvent({
      kind: 9,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['h', CHANNEL_ID], authTag],
      content,
    }, priv)
    await publishEvent(RELAY_URL, evt, priv, [authTag])
    console.log('published alert event', evt.id)
  }
  return { ok: true }
}
