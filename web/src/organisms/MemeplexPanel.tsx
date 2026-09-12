import { Link } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { FilterBar } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Select, type SelectOption } from '../atoms/Select'
import { cn } from '../lib/cn'
import type { MemeplexPanelModel } from './memeplexPanelModel'

const PICK_PLACEHOLDER: SelectOption = { value: '', label: 'Link from your binder…' }

/* The strip's own copy scale: 14/18 on ink-muted, which is the smallest the ladder goes before
   the micro line the cards themselves use. */
const LINE = 'text-small text-ink-muted'

/* The memeplex card's heading is one step above the shared `Panel` default: the detail board
   (296-0 › `Memeplex / Family` G5X-0, text G5Y-0) draws it at 18/22 on `--tracking-title` where
   `Panel` paints 17/21. Local to this panel — `atoms/Panel` keeps its own step for every other
   section — and `.class h3` (0,1,1) outranks Panel's `:where(h3,h4)` (0,1,0) without `!`. */
const HEADING = '[&_h3]:text-[18px]/[22px] [&_h3]:tracking-title'

/** This meme's ancestry, remixes, related cards, and controlled linking controls. */
export function MemeplexPanel({ model }: { model: MemeplexPanelModel }) {
  if (!model.show) return null

  return (
    /* The raised section card every panel on the page wears (`atoms/Panel`): bg-surface,
       radius-card, shadow-raised, with its display heading stepped to the board's 18/22. */
    <Panel className={cn('mt-4', HEADING)}>
      <h3>🕸️ Memeplex</h3>
      {model.ancestors.length > 0 && (
        <p className={cn('my-2', LINE)}>
          Descended from{' '}
          {model.ancestors.map((ancestor, index) => (
            <span key={ancestor.id}>
              {index > 0 && ' → '}
              <Link className="text-link no-underline hover:underline" {...ancestor.linkProps}>
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
          className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 max-sm:grid-cols-2"
        >
          {model.family.map((card) => (
            <MemeCard key={card.id} model={card} />
          ))}
        </div>
      ) : (
        <p className={LINE}>
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
