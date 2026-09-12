import { Link } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { MemeCard } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { FilterBar } from '../atoms/PageHead'
import { Panel, PanelHeading } from '../atoms/Panel'
import { Select, type SelectOption } from '../atoms/Select'
import { cn } from '../lib/cn'
import type { MemeplexPanelModel } from './memeplexPanelModel'

const PICK_PLACEHOLDER: SelectOption = { value: '', label: 'Link from your binder…' }

/* The strip's own copy scale: 14/18 on ink-muted, which is the smallest the ladder goes before
   the micro line the cards themselves use. */
const LINE = 'text-small text-ink-muted'

/** This meme's ancestry, remixes, related cards, and controlled linking controls. */
export function MemeplexPanel({ model }: { model: MemeplexPanelModel }) {
  if (!model.show) return null

  return (
    /* The raised section card every panel on the page wears (`atoms/Panel`): bg-surface,
       radius-card, shadow-raised, with its head at the board's own 18/22 step (296-0 ›
       `Memeplex / Family` G5X-0, text G5Y-0) rather than `Panel`'s shared 17/21. */
    <Panel className="mt-4">
      <PanelHeading size="section">🕸️ Memeplex</PanelHeading>
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
          className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] items-start gap-3 max-sm:grid-cols-2"
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
          <Input
            className="min-w-[180px]"
            placeholder="…or paste a meme link"
            {...model.pastedProps}
          />
          {/* one primary per card: the model already chose which of the two inputs this submits */}
          {model.showLink && (
            <Button variant="primary" {...model.linkButtonProps}>
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
