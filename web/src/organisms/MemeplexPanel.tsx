import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { MemeplexPanelModel } from './memeplexPanelModel'

/** This meme's ancestry, remixes, related cards, and controlled linking controls. */
export function MemeplexPanel({ model }: { model: MemeplexPanelModel }) {
  if (!model.show) return null

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <strong>🕸️ Memeplex</strong>
      {model.ancestors.length > 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '8px 0' }}>
          Descended from{' '}
          {model.ancestors.map((ancestor, index) => (
            <span key={ancestor.id}>
              {index > 0 && ' → '}
              <Link {...ancestor.linkProps}>"{ancestor.title}"</Link>
            </span>
          ))}
          {model.showOriginalLabel && ' (the original)'}
        </p>
      )}

      {model.family.length > 0 ? (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginTop: 10 }}>
          {model.family.map((card) => <MemeCard key={card.id} model={card} />)}
        </div>
      ) : (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>No relatives yet — remix this meme or link related ones.</p>
      )}

      {model.canEdit && (
        <div className="filter-bar" style={{ marginTop: 12 }}>
          <select {...model.pickerProps}>
            <option value="">Link from your binder…</option>
            {model.linkable.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
          </select>
          {model.showPickLink && <button className="primary" {...model.pickLinkButtonProps}>Link</button>}
          <input placeholder="…or paste a meme link" {...model.pastedProps} style={{ minWidth: 180 }} />
          {model.showPastedLink && <button className="primary" {...model.pastedLinkButtonProps}>Link</button>}
        </div>
      )}
      {model.notice && <p className="notice ok" style={{ marginTop: 8 }}>{model.notice}</p>}
    </div>
  )
}
