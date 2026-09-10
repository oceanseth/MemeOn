import { Link } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { FilterBar } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Select, type SelectOption } from '../atoms/Select'
import type { MemeplexPanelModel } from './memeplexPanelModel'

const PICK_PLACEHOLDER: SelectOption = { value: '', label: 'Link from your binder…' }

/** This meme's ancestry, remixes, related cards, and controlled linking controls. */
export function MemeplexPanel({ model }: { model: MemeplexPanelModel }) {
  if (!model.show) return null

  return (
    <Panel className="mt-4">
      <h3>🕸️ Memeplex</h3>
      {model.ancestors.length > 0 && (
        <p className="my-2 text-[13.5px] leading-[1.55] text-text-dim">
          Descended from{' '}
          {model.ancestors.map((ancestor, index) => (
            <span key={ancestor.id}>
              {index > 0 && ' → '}
              <Link className="text-accent no-underline" {...ancestor.linkProps}>
                "{ancestor.title}"
              </Link>
            </span>
          ))}
          {model.showOriginalLabel && ' (the original)'}
        </p>
      )}

      {model.family.length > 0 ? (
        /* tighter tracks than the market grid; the ≤560 rule still takes it 2-up */
        <div
          data-slot="memeplex-grid"
          className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 max-sm:grid-cols-2"
        >
          {model.family.map((card) => (
            <MemeCard key={card.id} model={card} />
          ))}
        </div>
      ) : (
        <p className="text-[13.5px] leading-[1.55] text-text-dim">
          No relatives yet — remix this meme or link related ones.
        </p>
      )}

      {model.canEdit && (
        <FilterBar className="mt-3">
          <Select
            items={[PICK_PLACEHOLDER, ...model.linkable.map((candidate) => ({ value: candidate.id, label: candidate.title }))]}
            {...model.pickerProps}
          />
          {model.showPickLink && (
            <Button variant="primary" {...model.pickLinkButtonProps}>
              Link
            </Button>
          )}
          <Input
            className="min-w-[180px]"
            placeholder="…or paste a meme link"
            {...model.pastedProps}
          />
          {model.showPastedLink && (
            <Button variant="primary" {...model.pastedLinkButtonProps}>
              Link
            </Button>
          )}
        </FilterBar>
      )}
      <div {...model.noticeProps}>
        {model.notice && (
          <Notice tone="ok" role="none">
            {model.notice}
          </Notice>
        )}
      </div>
      <div {...model.errorProps}>
        {model.error && (
          <Notice tone="error" role="none">
            {model.error}
          </Notice>
        )}
      </div>
    </Panel>
  )
}
