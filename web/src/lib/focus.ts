/**
 * The one focus ring this app wears, authored once.
 *
 * Three clauses, all three load-bearing: 3px of `--color-focus` two out, stepped to 4 when the OS
 * asks for more contrast, and handed to the platform's own `Highlight` in forced colours (where a
 * custom property paints nothing). Hand copies kept drifting to two of the three, so controls
 * import this instead — `cn()` still lets a caller override the offset for an inset ring.
 */
export const FOCUS_RING = [
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
].join(' ')
