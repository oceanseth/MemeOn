import type { ReactEventHandler } from 'react'

/** The letter a pictureless avatar shows: first grapheme, uppercased, `?` when the name is blank. */
export function avatarInitial(name: string): string {
  return ([...name.trim()][0] ?? '?').toLocaleUpperCase()
}

const escapeGlyph = (glyph: string): string =>
  glyph.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The same monogram `.avatar-fallback` paints, as an image source. The disc and the border come
 * from `.avatar`; only the glyph colour is repeated here (it mirrors `--text-dim`), because a
 * `data:` document cannot read the page's custom properties.
 */
export function avatarMonogramSrc(name: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<text x="20" y="20" dy=".35em" text-anchor="middle" fill="#97a0b5"' +
    ' font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="700">' +
    `${escapeGlyph(avatarInitial(name))}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Real accounts carry Google avatar URLs that expire or 404, and a failed `<img>` leaves the
 * browser's torn-image glyph inside the circle. One swap to the monogram, marked on the element
 * so a fallback that itself failed can never loop.
 */
export function avatarErrorHandler(name: string): ReactEventHandler<HTMLImageElement> {
  return (event) => {
    const img = event.currentTarget
    if (img.dataset.avatarFallback === 'true') return
    img.dataset.avatarFallback = 'true'
    img.src = avatarMonogramSrc(name)
  }
}
