import { useCallback, useMemo } from 'react'
import type { MouseEvent } from 'react'
import type { Meme, QuestKey, QuestStep } from '../types'

/** Where each undone quest sends you to go do the thing. */
const QUEST_LINKS: Partial<Record<QuestKey, string>> = {
  mint: '/binder/new',
  share: '/binder',
  friend: '/friends',
  trade: '/marketplace',
}

/** What claiming the starter pack returned. */
export interface PackResult {
  memes: Meme[]
  reward: number
}

export type QuestItem =
  | { kind: 'claim'; key: QuestKey; label: string; buttonProps: { onClick: () => void; disabled: boolean } }
  | {
      kind: 'chip' | 'link'
      key: QuestKey
      title: string
      reward: number
      done: boolean
      marker: string
      hint: string
      linkProps: { to: string; title: string } | null
    }

/**
 * Mechanism for the onboarding strip: visibility, progress count, per-step
 * shape (claim button vs linked chip vs plain chip), and the pack modal.
 * `done` is a flag — the caller decides how a completed quest looks.
 */
export function useQuestBar({
  steps,
  busy = false,
  packResult = null,
  brandImageSrc = '/api/brand/braincell.png',
  onClaimPack,
  onDismissPack,
}: {
  steps: QuestStep[]
  busy?: boolean
  packResult?: PackResult | null
  brandImageSrc?: string
  onClaimPack: () => void
  onDismissPack: () => void
}) {
  const stopPropagation = useCallback((e: MouseEvent) => e.stopPropagation(), [])

  const items = useMemo<QuestItem[]>(
    () =>
      steps.map((s) => {
        if (s.key === 'pack' && !s.done) {
          return {
            kind: 'claim',
            key: s.key,
            label: busy ? 'Opening…' : `${s.title} (+${s.reward} 🧠)`,
            buttonProps: { onClick: onClaimPack, disabled: busy },
          }
        }
        const to = s.done ? null : QUEST_LINKS[s.key]
        return {
          kind: to ? 'link' : 'chip',
          key: s.key,
          title: s.title,
          reward: s.reward,
          done: s.done,
          marker: s.done ? '✅' : '⬜',
          hint: s.hint,
          linkProps: to ? { to, title: s.hint } : null,
        }
      }),
    [steps, busy, onClaimPack],
  )

  return useMemo(() => {
    const doneCount = steps.filter((s) => s.done).length
    const packMemes = packResult?.memes ?? []
    return {
      visible: steps.length > 0,
      doneCount,
      total: steps.length,
      items,
      progressLabel: `Earn your braincells · ${doneCount}/${steps.length}`,
      brandImageProps: { src: brandImageSrc, alt: 'braincell' },

      packOpen: !!packResult,
      packMemes,
      packBody: packResult
        ? packMemes.length > 0
          ? `You now hold 10 shares in each of these — plus ${packResult.reward} 🧠 braincells.`
          : `The vault was empty, so you got ${packResult.reward} 🧠 braincells instead. Spend them wisely.`
        : '',
      packMarkProps: { src: brandImageSrc, alt: '' },
      packOverlayProps: { onClick: onDismissPack },
      packModalProps: { onClick: stopPropagation },
      packBinderLinkProps: { to: '/binder' },
      packDismissProps: { onClick: onDismissPack },
    }
  }, [steps, items, packResult, brandImageSrc, onDismissPack, stopPropagation])
}
