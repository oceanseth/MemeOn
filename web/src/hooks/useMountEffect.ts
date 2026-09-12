import { useEffect, type EffectCallback } from 'react'

/** Mount-only effect. Store bags call retain() here and dispose() in the cleanup. */
export function useMountEffect(effect: EffectCallback): void {
  useEffect(effect, [])
}
