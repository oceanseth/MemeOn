/* Keep a selected image across MV3 worker suspension. Never store credentials or browsing history.
   Records belong to one destination tab, expire after ten minutes, and are removed on handoff. */
globalThis.PendingImages = (() => {
  const TTL = 10 * 60 * 1000
  // Tab IDs can be reused after a browser restart. Bind records to this browser session too.
  const session = chrome.storage.session.get('handoffSession').then(async ({ handoffSession }) => {
    if (handoffSession) return handoffSession
    const id = crypto.randomUUID()
    await chrome.storage.session.set({ handoffSession: id })
    return id
  })
  const db = new Promise((resolve, reject) => {
    const request = indexedDB.open('memeon-handoff', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'tabId' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  async function transact(mode, operation) {
    const database = await db
    return new Promise((resolve, reject) => {
      const tx = database.transaction('images', mode)
      const request = operation(tx.objectStore('images'))
      tx.oncomplete = () => resolve(request?.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }
  const remove = (tabId) => transact('readwrite', (store) => store.delete(tabId))
  async function prune() {
    const sessionId = await session
    const records = await transact('readonly', (store) => store.getAll())
    await Promise.all(
      records
        .filter((r) => Date.now() - r.createdAt > TTL || r.sessionId !== sessionId)
        .map((r) => remove(r.tabId)),
    )
  }
  async function put(record) {
    await prune()
    const sessionId = await session
    await transact('readwrite', (store) =>
      store.put({ ...record, sessionId, createdAt: Date.now() }),
    )
  }
  async function get(tabId) {
    const record = await transact('readonly', (store) => store.get(tabId))
    if (!record) return null
    if (Date.now() - record.createdAt > TTL || record.sessionId !== (await session)) {
      await remove(tabId)
      return null
    }
    return record
  }
  return { put, get, remove, prune }
})()
