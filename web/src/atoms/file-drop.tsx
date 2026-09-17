import { Input as BaseInput } from '@base-ui/react/input'
import { Icon } from '@/atoms/icon'
import { cn } from '@/lib/cn'

/**
 * The app's own file picker.
 *
 * `<input type="file">` is the one control whose *words* the browser writes. "Choose File", "No
 * file chosen" — in the user agent's locale, at a width no stylesheet can set, past every gate
 * `copy/` exists to hold. Dressing `::file-selector-button` repaints the button and leaves the
 * sentence beside it the browser's, which is how this form shipped a row that read nothing like
 * the two fields above it.
 *
 * So the input is kept — it is the only thing that opens the OS dialog, and it is the control the
 * `Field` label names — and made invisible at full size across the well. Everything the user sees
 * is painted underneath it; everything the user reads arrives as a prop, from `copy/`. Covering
 * the well rather than hiding the input in a corner is what keeps the browser's own behaviour:
 * click anywhere, drop a file anywhere, tab to it, Space to open.
 *
 * `lint/memeon.js`'s `memeon/no-native-chrome` is what keeps a bare one from reappearing
 * elsewhere; `.oxlintrc.json` scopes the exception to this file.
 */

/** The recess the text fields wear, hover-lit because the whole row is the control. */
const WELL = [
  'relative flex min-h-12.5 items-center gap-3 rounded-md material-pressed p-2',
  'cursor-pointer select-none transition-press hover:bg-accent',
  'focus-ring-within disabled-look',
]

/**
 * Paint, not a control: the input above it takes every click, so this is a `<span>` with the raised
 * pill's recipe rather than a `Button` whose hover and press states could never fire.
 */
const PILL = [
  'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg material-raised px-3.5',
  'text-sm font-medium text-foreground',
]

/** The chosen name, or the line standing in for it; `data-empty` is the muted state. */
const NAME = 'min-w-0 flex-1 truncate text-base font-normal text-foreground data-empty:text-muted-foreground'

/** Invisible, but the full size of the well: still the click target, the drop target and the tab stop. */
const CONTROL = 'absolute inset-0 size-full cursor-pointer opacity-0'

export interface FileDropProps {
  /** The same list the native input takes; it filters the OS dialog and a drop alike. */
  accept: string
  /** The pill's words. */
  chooseLabel: string
  /** What the row reads before a pick — the sentence the browser used to write. */
  emptyLabel: string
  /** The chosen file's name, once there is one. */
  fileName?: string | null | undefined
  onFile: (file: File) => void
  id?: string | undefined
  name?: string | undefined
  disabled?: boolean | undefined
  'aria-describedby'?: string | undefined
  className?: string | undefined
}

export function FileDrop({
  accept,
  chooseLabel,
  emptyLabel,
  fileName,
  onFile,
  id,
  name,
  disabled,
  'aria-describedby': describedBy,
  className,
}: FileDropProps) {
  return (
    <div
      data-slot="file-drop"
      data-disabled={disabled || undefined}
      className={cn(WELL, className)}
    >
      {/* decorative: the control a reader lands on is the input, named by the Field's own label */}
      <span aria-hidden="true" data-slot="file-drop-button" className={cn(PILL)}>
        <Icon name="upload" size={16} />
        {chooseLabel}
      </span>
      <span data-slot="file-drop-name" data-empty={fileName ? undefined : 'true'} className={NAME}>
        {fileName || emptyLabel}
      </span>
      <BaseInput
        type="file"
        accept={accept}
        id={id}
        name={name}
        disabled={disabled}
        aria-describedby={describedBy}
        className={CONTROL}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onFile(file)
        }}
      />
    </div>
  )
}
