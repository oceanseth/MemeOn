import { useCallback, useEffect, useState } from 'react'
import { apiFetch, post } from '../lib/api'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface KeyRow {
  prefix: string
  label: string
  createdAt: string
}

export default function Developers() {
  const [keys, setKeys] = useState<KeyRow[] | null>(null)
  const [label, setLabel] = useState('')
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<KeyRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    apiFetch<{ keys: KeyRow[] }>('/api/developers/keys')
      .then((r) => setKeys(r.keys))
      .catch(() => setKeys([]))
  }, [])

  useEffect(load, [load])

  const create = async () => {
    setErr(null)
    try {
      const out = await post<{ key: string }>('/api/developers/keys', {
        label: label.trim() || 'my key',
      })
      setFreshKey(out.key)
      setLabel('')
      load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'key creation failed')
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <h2>🔧 Developers</h2>
        <a href="/skill.md" target="_blank" rel="noreferrer">
          <button>📜 API skill.md</button>
        </a>
      </div>
      <p style={{ color: 'var(--text-dim)', maxWidth: 720 }}>
        API keys act as <strong>your account</strong>: they can mint memes, gift shares (including
        to users your own site knows only by Masky avatar id), trade, and read everything you can.
        Full endpoint reference lives in{' '}
        <a href="/skill.md" target="_blank" rel="noreferrer">
          skill.md
        </a>{' '}
        (also at <code>/.well-known/skill.md</code> for agents). Treat keys like passwords.
      </p>

      <div className="panel" style={{ maxWidth: 720, marginTop: 16 }}>
        <div className="filter-bar">
          <input
            placeholder="Key label (e.g. my-trading-bot)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            style={{ minWidth: 240 }}
          />
          <button className="primary" onClick={create}>
            ＋ Generate key
          </button>
        </div>
        {err && <p className="notice error" style={{ marginTop: 10 }}>{err}</p>}
        {freshKey && (
          <div className="notice ok" style={{ marginTop: 12, wordBreak: 'break-all' }}>
            <strong>Copy it now — shown once:</strong>
            <div style={{ fontFamily: 'monospace', margin: '8px 0' }}>{freshKey}</div>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(freshKey)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? 'Copied ✓' : 'Copy key'}
            </button>
          </div>
        )}
      </div>

      <div className="panel" style={{ maxWidth: 720, marginTop: 16 }}>
        <strong>Your keys</strong>
        <div className="row-list" style={{ marginTop: 10 }}>
          {keys === null ? (
            <span className="spin" />
          ) : keys.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>No keys yet.</p>
          ) : (
            keys.map((k) => (
              <div key={k.prefix} className="person-row">
                <span style={{ fontFamily: 'monospace' }}>{k.prefix}…</span>
                <span className="person-stats">{k.label}</span>
                <span className="spacer" />
                <span className="person-stats">{new Date(k.createdAt).toLocaleDateString()}</span>
                <button className="danger" onClick={() => setRevoking(k)}>
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!revoking}
        danger
        title="Revoke this API key?"
        message={
          <>
            <code>{revoking?.prefix}…</code> ({revoking?.label}) will stop working immediately.
            Anything using it breaks.
          </>
        }
        confirmLabel="Revoke it"
        onCancel={() => setRevoking(null)}
        onConfirm={async () => {
          if (!revoking) return
          await apiFetch(`/api/developers/keys/${revoking.prefix}`, { method: 'DELETE' }).catch(
            () => {},
          )
          setRevoking(null)
          load()
        }}
      />
    </main>
  )
}
