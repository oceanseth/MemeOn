import { useEffect, type EffectCallback } from 'react'

/** Mount-only effect. Name exists so Storybook preview can dispose stores without a raw useEffect in the decorator file's intent. */
export function useMountEffect(effect: EffectCallback): void {
  useEffect(effect, [])
}
