import type { DevelopersScreenModel } from '../hooks/useDevelopersScreen'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

/** Developers API-key page as a function of its model. Every engine state is one set of args. */
export function DevelopersScreen({
  keys,
  freshKey,
  err,
  showSpinner,
  showEmpty,
  showKeys,
  showErr,
  showFreshKey,
  copyLabel,
  labelInputProps,
  createButtonProps,
  copyButtonProps,
  errorNoticeProps,
  confirmDialog,
}: DevelopersScreenModel) {
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
            style={{ minWidth: 240 }}
            {...labelInputProps}
          />
          <button className="primary" {...createButtonProps}>
            ＋ Generate key
          </button>
        </div>
        {showErr && <p className="notice error" style={{ marginTop: 10 }} {...errorNoticeProps}>{err}</p>}
        {showFreshKey && (
          <div className="notice ok" style={{ marginTop: 12, wordBreak: 'break-all' }}>
            <strong>Copy it now — shown once:</strong>
            <div style={{ fontFamily: 'monospace', margin: '8px 0' }}>{freshKey}</div>
            <button {...copyButtonProps}>
              {copyLabel}
            </button>
          </div>
        )}
      </div>

      <div className="panel" style={{ maxWidth: 720, marginTop: 16 }}>
        <strong>Your keys</strong>
        <div className="row-list" style={{ marginTop: 10 }}>
          {showSpinner ? (
            <span className="spin" />
          ) : showEmpty ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>No keys yet.</p>
          ) : showKeys && keys ? (
            keys.map((k) => (
              <div key={k.prefix} className="person-row">
                <span style={{ fontFamily: 'monospace' }}>{k.prefix}…</span>
                <span className="person-stats">{k.label}</span>
                <span className="spacer" />
                <span className="person-stats">{k.createdLabel}</span>
                <button className="danger" {...k.revokeButtonProps}>
                  Revoke
                </button>
              </div>
            ))
          ) : null}
        </div>
      </div>

      <ConfirmDialog model={confirmDialog} />
    </main>
  )
}
