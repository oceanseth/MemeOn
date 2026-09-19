import { sharedCopy } from './shared'

/**
 * The two routes that render `AuthStatusScreen`: the Masky OAuth callback and the mobile forward.
 * Keys name the role of the string, not its content.
 */
export const authStatusCopy = {
  callback: {
    /** Tab title; no ellipsis — do not collapse onto `working.title`. */
    documentTitle: 'Completing Masky login',
    working: {
      title: 'Completing Masky login…',
      subtitle: 'Taking you back to MemeOn.',
      prompt: 'Taking longer than usual?',
    },
    failed: {
      title: 'Masky login didn’t finish',
    },
    /** Masky finished; POST /api/invites/accept did not. Stay on the callback card. */
    inviteFailed: {
      title: 'Invite didn’t go through',
    },
    /** What the notice says when Masky sent no code, or the exchange threw nothing readable. */
    errors: {
      missingCode: 'missing authorization code',
      loginFailed: 'login failed',
    },
    retry: sharedCopy.tryAgain,
    home: sharedCopy.backToBrand,
  },
  mobileForward: {
    /** Tab title; not the on-screen card title (no “MemeOn app…”). */
    documentTitle: 'Returning to the app',
    title: 'Returning to the MemeOn app…',
    subtitle: 'Open the MemeOn app, or keep going on the web.',
    open: 'Open MemeOn',
    prompt: 'Nothing happened?',
    home: 'Continue on the web',
  },
} as const
