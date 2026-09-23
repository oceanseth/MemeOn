import { sharedCopy } from '../copy/shared'
import { useMountEffect } from './useMountEffect'

/**
 * WCAG 2.4.2: a single-page app keeps `index.html`'s marketing title on every route unless the route
 * says otherwise, which leaves a tab strip, a history list and a screen reader's first announcement
 * all saying the same thing everywhere. Each view names its own page here.
 *
 * Mount-only on purpose: the name is the *route's*, not the record's, so it is settled before the
 * fetch is (a title that arrives late is a title announced twice). The previous title is restored on
 * unmount, so a route that never names itself cannot inherit the last one's.
 */
export function useDocumentTitle(title: string): void {
  useMountEffect(() => {
    const previous = document.title
    document.title = sharedCopy.documentTitle(title)
    return () => {
      document.title = previous
    }
  })
}
