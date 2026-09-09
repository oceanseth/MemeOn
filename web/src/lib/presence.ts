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

/** Call it to stop watching; call `setSubs` to change who is watched. */
export interface PresenceWatch {
  (): void
  /** Watch exactly these uids — one listener per uid, so strangers never wake this tab. */
  setSubs(subs: readonly string[]): void
}

/**
 * Watch the online state of specific uids. Starts watching nobody: the caller narrows
 * the set with `setSubs` once it knows who its friends are.
 */
export function watchPresence(cb: (onlineUids: Set<string>) => void): PresenceWatch {
  const listeners = new Map<string, () => void>()
  const online = new Set<string>()
  let stopped = false
  const emit = () => cb(new Set(online))

  const stop = (() => {
    stopped = true
    for (const off of listeners.values()) off()
    listeners.clear()
    online.clear()
  }) as PresenceWatch

  stop.setSubs = (subs) => {
    if (stopped) return
    const wanted = new Set(subs)
    let changed = false
    for (const [sub, off] of listeners) {
      if (wanted.has(sub)) continue
      off()
      listeners.delete(sub)
      if (online.delete(sub)) changed = true
    }
    for (const sub of wanted) {
      if (listeners.has(sub)) continue
      listeners.set(
        sub,
        onValue(
          ref(rtdb, `presence/${sub}`),
          (snap) => {
            const next = snap.exists()
            if (next === online.has(sub)) return
            if (next) online.add(sub)
            else online.delete(sub)
            emit()
          },
          () => {
            if (online.delete(sub)) emit()
          },
        ),
      )
    }
    if (changed) emit()
  }

  return stop
}
