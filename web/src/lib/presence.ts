// Online presence over the Firebase Realtime Database. Each signed-in user
// maintains presence/{uid} while connected; onDisconnect cleans it up server-side.
import {
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from 'firebase/database'
import { rtdb } from './firebase'

/** Start advertising this uid as online. Returns a stop function. */
export function startPresence(uid: string): () => void {
  const me = ref(rtdb, `presence/${uid}`)
  const connected = ref(rtdb, '.info/connected')
  const unsub = onValue(connected, (snap) => {
    if (!snap.val()) return
    void onDisconnect(me)
      .remove()
      .then(() => set(me, { online: true, at: serverTimestamp() }))
      .catch(() => {})
  })
  return () => {
    unsub()
    void remove(me).catch(() => {})
  }
}

/** Watch the set of online uids. Returns an unsubscribe function. */
export function watchPresence(cb: (onlineUids: Set<string>) => void): () => void {
  return onValue(
    ref(rtdb, 'presence'),
    (snap) => cb(new Set(Object.keys((snap.val() as Record<string, unknown> | null) ?? {}))),
    () => cb(new Set()),
  )
}
