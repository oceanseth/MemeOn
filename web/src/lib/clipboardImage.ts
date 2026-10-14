import { createMemeCopy } from '../copy/createMeme'

const copy = createMemeCopy

/**
 * The upload desk's clipboard seam. Two routes in:
 *
 * - A `paste` event (Ctrl+V) hands over real `File`s with no permission involved; the hook routes
 *   them through `onPasteCapture`.
 * - The async reader (`navigator.clipboard.read`) backs the Paste button, and — only where the
 *   `clipboard-read` permission is already granted — the silent probe that lets the button
 *   advertise "clipboard image detected" without ever popping a prompt uninvited. Safari and
 *   Firefox don't expose that permission descriptor, so there the probe stays quiet and the
 *   button still reads on the click (their own paste confirmation UI is the prompt).
 */

/** The async clipboard reader exists here; the Paste button renders only then. */
export function supportsClipboardRead(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.read === 'function'
}

/** True only when a read would be answered silently — this never triggers a permission prompt. */
async function clipboardReadGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    })
    return status.state === 'granted'
  } catch {
    return false
  }
}

/** Is an image waiting on the clipboard right now? Reads only behind a granted permission. */
export async function probeClipboardImage(): Promise<boolean> {
  if (!supportsClipboardRead()) return false
  if (!(await clipboardReadGranted())) return false
  try {
    const items = await navigator.clipboard.read()
    return items.some((item) => item.types.some((type) => type.startsWith('image/')))
  } catch {
    /* an unfocused document or an unreadable clipboard: no hint, not an error */
    return false
  }
}

const extensionOf = (type: string): string => {
  const subtype = type.slice('image/'.length)
  return subtype === 'jpeg' ? 'jpg' : (subtype.split('+')[0] ?? subtype)
}

/**
 * Pull the image off the clipboard as the `File` the upload path already takes. `null` when the
 * clipboard holds no image; a permission refusal or detached clipboard rejects, and the caller
 * turns that into its own copy.
 */
export async function readClipboardImage(): Promise<File | null> {
  const items = await navigator.clipboard.read()
  for (const item of items) {
    const type = item.types.find((candidate) => candidate.startsWith('image/'))
    if (!type) continue
    const blob = await item.getType(type)
    return new File([blob], copy.upload.pastedFileName(extensionOf(type)), { type })
  }
  return null
}

/** A paste aimed here should stay a text paste whenever the clipboard also carries text. */
export function takesTextPaste(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}
