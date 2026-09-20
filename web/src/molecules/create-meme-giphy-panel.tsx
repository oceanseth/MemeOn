import { Button } from '@/atoms/button'
import { Empty, EmptyDescription } from '@/atoms/empty'
import { Field, FieldLabel, Hint } from '@/atoms/field'
import { Input } from '@/atoms/input'
import { Select } from '@/atoms/select'
import { Textarea } from '@/atoms/textarea'
import { Toolbar } from '@/atoms/toolbar'
import { Icon } from '@/atoms/icon'
import { cn } from '../lib/cn'
import type { CreateMemeScreenModel } from '../lib/createMemeModel'

const COST_NOTE = 'text-sm font-semibold text-muted-foreground'
const GIPHY_MARK =
  'text-xs font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase'

export type CreateMemeGiphyPanelProps = Pick<
  CreateMemeScreenModel,
  | 'giphyCategoryLabel'
  | 'giphyCategorySelectProps'
  | 'giphySearchLabel'
  | 'giphyQueryInputProps'
  | 'giphyQueryPlaceholder'
  | 'giphySearchButtonProps'
  | 'giphySearchButtonLabel'
  | 'giphyPoweredBy'
  | 'showGiphyResults'
  | 'giphyResults'
  | 'getGiphyResultProps'
  | 'giphyStatusHidden'
  | 'giphyStatusProps'
  | 'giphyStatusText'
  | 'showGiphyPick'
  | 'giphyPick'
  | 'giphySelectedPrefix'
  | 'giphyPickSuffix'
  | 'giphyOptionalPromptLabel'
  | 'giphyPromptTextareaProps'
  | 'giphyRemixPlaceholder'
  | 'showGiphyRemixButton'
  | 'applyGiphyEditButtonProps'
  | 'giphyRemixButtonLabel'
  | 'creditsNote'
>

/** Category / search / pick / optional Masky remix. URL mint is a sibling panel. */
export function CreateMemeGiphyPanel({
  giphyCategoryLabel,
  giphyCategorySelectProps,
  giphySearchLabel,
  giphyQueryInputProps,
  giphyQueryPlaceholder,
  giphySearchButtonProps,
  giphySearchButtonLabel,
  giphyPoweredBy,
  showGiphyResults,
  giphyResults,
  getGiphyResultProps,
  giphyStatusHidden,
  giphyStatusProps,
  giphyStatusText,
  showGiphyPick,
  giphyPick,
  giphySelectedPrefix,
  giphyPickSuffix,
  giphyOptionalPromptLabel,
  giphyPromptTextareaProps,
  giphyRemixPlaceholder,
  showGiphyRemixButton,
  applyGiphyEditButtonProps,
  giphyRemixButtonLabel,
  creditsNote,
}: CreateMemeGiphyPanelProps) {
  return (
    <div data-slot="create-meme-giphy-panel" className="contents">
      <Field>
        <FieldLabel>{giphyCategoryLabel}</FieldLabel>
        <Select aria-label={giphyCategoryLabel} {...giphyCategorySelectProps} />
      </Field>
      <Field>
        <FieldLabel>{giphySearchLabel}</FieldLabel>
        <Input {...giphyQueryInputProps} placeholder={giphyQueryPlaceholder} />
      </Field>
      <Toolbar>
        <Button {...giphySearchButtonProps}>{giphySearchButtonLabel}</Button>
        <span className={GIPHY_MARK}>{giphyPoweredBy}</span>
      </Toolbar>

      {showGiphyResults && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
          {giphyResults.map((result) => {
            const cell = getGiphyResultProps(result)
            return (
              <Button
                key={result.id}
                variant="cell"
                size="cell"
                pressed={cell.picked}
                {...cell.buttonProps}
              >
                <img {...cell.imageProps} className="block h-full w-full object-cover" />
              </Button>
            )
          })}
        </div>
      )}

      {/* one live region for the panel: the chrome swaps, the element never remounts.
          The card is never restyled away — the wrapper takes it off screen instead. */}
      <div className={cn(giphyStatusHidden && 'sr-only')}>
        <Empty className="py-8" {...giphyStatusProps}>
          <EmptyDescription>{giphyStatusText}</EmptyDescription>
        </Empty>
      </div>

      {showGiphyPick && giphyPick && (
        <>
          <Hint className="mb-2">
            {giphySelectedPrefix} <strong>{giphyPick.title}</strong>
            {giphyPick.authorLabel} {giphyPickSuffix}
          </Hint>
          <Field>
            <FieldLabel>{giphyOptionalPromptLabel}</FieldLabel>
            <Textarea {...giphyPromptTextareaProps} rows={2} placeholder={giphyRemixPlaceholder} />
          </Field>
          {showGiphyRemixButton && (
            <Toolbar className="mt-1">
              <Button variant="primary" {...applyGiphyEditButtonProps}>
                <Icon name="sparkles" size={16} /> {giphyRemixButtonLabel}
              </Button>
              <span className={COST_NOTE}>{creditsNote}</span>
            </Toolbar>
          )}
        </>
      )}
    </div>
  )
}
