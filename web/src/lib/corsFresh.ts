/**
 * The card's own `<video>` loads this file without CORS, and a browser that cached that answer
 * replays it to the CORS request, which then fails. A distinct query string is a distinct cache
 * entry, so the frame grab always gets an answer made for it.
 */
export function corsFresh(videoUrl: string): string {
  try {
    const url = new URL(videoUrl)
    url.searchParams.set('frame', '1')
    return url.toString()
  } catch {
    return videoUrl
  }
}
