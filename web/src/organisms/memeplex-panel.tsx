import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button } from '@/atoms/button'
import { Card, CardTitle } from '@/atoms/card'
import { InlineLink } from '@/atoms/inline-link'
import { Input } from '@/atoms/input'
import { LiveRegion } from '@/atoms/live-region'
import { MemeCard } from '@/molecules/meme-card'
import { Select } from '@/atoms/select'
import { Toolbar, ToolbarStart } from '@/atoms/toolbar'
import { cn } from '../lib/cn'
import type { MemeplexPanelModel } from '../lib/memeplexPanelModel'
import { Icon } from '@/atoms/icon'

/* The strip's own copy scale: 14/18 on ink-muted, which is the smallest the ladder goes before
   the micro line the cards themselves use. */
const LINE = 'text-sm text-muted-foreground'

/** This meme's ancestry, remixes, related cards, and controlled linking controls. */
export function MemeplexPanel({ model }: { model: MemeplexPanelModel }) {
  if (!model.show) return null

  return (
    /* The raised section card every panel on the page wears: `bg-card`, `rounded-lg`,
       `material-card`, the card inset, with its head at the shared intro step. */
    <Card className="mt-4">
      <CardTitle size="intro" render={<h3 />} className="mb-1.5">
        <span aria-hidden="true">
          <Icon name="blocks" size={18} />
        </span>{' '}
        {model.heading}
      </CardTitle>
      {model.ancestors.length > 0 && (
        <p className={cn('my-2', LINE)}>
          {model.descendedFrom}{' '}
          {model.ancestors.map((ancestor, index) => (
            <span key={ancestor.id}>
              {index > 0 && ' → '}
              <InlineLink render={<Link {...ancestor.linkProps} />}>
                "{ancestor.title}"
              </InlineLink>
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
      ) : model.error ? null : (
        <p className={LINE}>
          {model.empty}
        </p>
      )}

      {model.canEdit && (
        <Toolbar className="mt-3">
          <ToolbarStart>
            <Select
              items={[model.pickPlaceholder, ...model.linkable.map((candidate) => ({ value: candidate.id, label: candidate.title }))]}
              {...model.pickerProps}
            />
            <Input
              className="min-w-45"
              {...model.pastedProps}
            />
            {/* one primary per card: the model already chose which of the two inputs this submits */}
            {model.showLink && (
              <Button variant="primary" {...model.linkButtonProps}>
                {model.linkLabel}
              </Button>
            )}
          </ToolbarStart>
        </Toolbar>
      )}
      <LiveRegion variant="visible" {...model.noticeProps}>
        {model.notice && (
          <Alert variant="success" role="none" className="mt-3">
            {model.notice}
          </Alert>
        )}
      </LiveRegion>
      <LiveRegion variant="visible" {...model.errorProps}>
        {model.error && (
          <Alert variant="error" role="none" className="mt-3">
            {model.error}
          </Alert>
        )}
      </LiveRegion>
    </Card>
  )
}
