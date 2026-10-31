/* Shared by the service worker and isolated content scripts; no page-world bridge. */
globalThis.MemeOn = (() => {
  const MAX_BYTES = 8 * 1024 * 1024
  const MAX_DATA_LENGTH = Math.ceil(MAX_BYTES / 3) * 4 + 128
  const MIME_EXTENSIONS = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  function imageUrl(value, base) {
    if (typeof value !== 'string' || !value.trim()) return null
    try {
      const url = new URL(value, base)
      if (url.username || url.password) return null
      if (['http:', 'https:', 'blob:'].includes(url.protocol)) return url.href
      if (
        url.protocol === 'data:' &&
        /^data:image\//i.test(value) &&
        value.length <= MAX_DATA_LENGTH
      )
        return value
    } catch {
      /* invalid source */
    }
    return null
  }
  function profile(value) {
    if (!value || typeof value.sub !== 'string' || !value.sub) return null
    let picture = null
    try {
      const url = new URL(value.picture)
      if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password)
        picture = url.href
    } catch {
      /* initials are the fallback */
    }
    return {
      sub: value.sub.slice(0, 256),
      name: String(value.name || 'MemeOn member').slice(0, 100),
      picture,
    }
  }
  async function boundedBlob(response) {
    if (!response.ok) throw new Error('This website did not allow the image to be downloaded.')
    if (Number(response.headers.get('content-length')) > MAX_BYTES)
      throw new Error('Choose an image smaller than 8 MB.')
    const reader = response.body?.getReader()
    if (!reader) throw new Error('The image was empty.')
    const chunks = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_BYTES) throw new Error('Choose an image smaller than 8 MB.')
        chunks.push(value)
      }
    } finally {
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
    if (!size) throw new Error('The image was empty.')
    return new Blob(chunks, { type: response.headers.get('content-type')?.split(';')[0] || '' })
  }
  async function dataUrl(blob) {
    if (blob.size > MAX_BYTES) throw new Error('Choose an image smaller than 8 MB.')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    return `data:${blob.type};base64,${btoa(binary)}`
  }
  return { MAX_BYTES, MAX_DATA_LENGTH, MIME_EXTENSIONS, imageUrl, profile, boundedBlob, dataUrl }
})()
