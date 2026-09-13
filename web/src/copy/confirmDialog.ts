import { sharedCopy } from './shared'

/** Default labels for the shared confirm dialog frame. Callers still pass title and message. */
export const confirmDialogCopy = {
  confirm: 'Confirm',
  cancel: sharedCopy.cancel,
  busy: 'Working…',
} as const
