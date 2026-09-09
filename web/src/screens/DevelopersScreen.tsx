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
  showLoadError,
  showOk,
  okMsg,
  emptyCopy,
  emptyHint,
  loadingLabel,
  loadErrorMessage,
  quotaLabel,
  quotaNote,
  createLabel,
  copyLabel,
  copyDone,
  labelInputProps,
  createFormProps,
  createButtonProps,
  copyButtonProps,
  retryButtonProps,
  freshKeyProps,
  freshKeyRegionProps,
  statusRegionProps,
  loadingProps,
  errorNoticeProps,
  loadErrorProps,
  confirmDialog,
}: DevelopersScreenModel) {
  return (
    <main className="container narrow" id="main" tabIndex={-1}>
      <div className="page-head">
        <h2>🔧 Developers</h2>
        <a className="btn" href="/skill.md" target="_blank" rel="noreferrer">
          📜 API skill.md
        </a>
      </div>
      <p className="muted">
        API keys act as <strong>your account</strong>: they can mint memes, gift shares (including
        to users your own site knows only by Masky avatar id), trade, and read everything you can.
        Full endpoint reference lives in{' '}
        <a href="/skill.md" target="_blank" rel="noreferrer">
          skill.md
        </a>{' '}
        (also at <code>/.well-known/skill.md</code> for agents). Treat keys like passwords.
      </p>

      <div className="panel" style={{ marginTop: 16 }}>
        <form className="filter-bar" {...createFormProps}>
          <input
            placeholder="Key label (e.g. my-trading-bot)"
            style={{ flex: '1 1 240px', minWidth: 240 }}
            {...labelInputProps}
          />
          <button className="primary" type="submit" {...createButtonProps}>
            <span aria-hidden="true">＋</span> {createLabel}
          </button>
        </form>
        {quotaNote && <p className="field-hint">{quotaNote}</p>}
        {showErr && <p className="notice error" {...errorNoticeProps}>{err}</p>}
        <div {...freshKeyRegionProps}>
          {showFreshKey && (
            <div className="notice ok">
              <strong>Copy it now — shown once:</strong>
              <div className="key-string" {...freshKeyProps}>{freshKey}</div>
              <button {...copyButtonProps}>
                {copyLabel}
                {copyDone && <span aria-hidden="true"> ✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>
          Your keys{quotaLabel && <> <span className="badge">{quotaLabel}</span></>}
        </h3>
        <div {...statusRegionProps}>
          {showOk && <p className="notice ok">{okMsg}</p>}
        </div>
        {showSpinner && (
          <div className="loading-state" {...loadingProps}>
            <span className="spin" aria-hidden="true" />
            {loadingLabel}
          </div>
        )}
        {showLoadError && (
          <div className="empty error" {...loadErrorProps}>
            <p><strong>{loadErrorMessage}</strong></p>
            <div className="empty-actions">
              <button className="primary" {...retryButtonProps}>Try again</button>
            </div>
          </div>
        )}
        {showEmpty && (
          <div className="empty">
            <p>{emptyCopy}</p>
            <p>{emptyHint}</p>
          </div>
        )}
        {showKeys && keys && (
          <ul className="row-list" style={{ marginTop: 10 }}>
            {keys.map((k) => (
              <li key={k.prefix} className="person-row">
                <div className="person-identity">
                  <span className="person-name key-label">{k.label}</span>
                  <span className="key-meta">
                    <code>{k.prefix}…</code>
                    <time dateTime={k.createdAt}>{k.createdLabel}</time>
                  </span>
                </div>
                <button className="danger" {...k.revokeButtonProps}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog model={confirmDialog} />
    </main>
  )
}
