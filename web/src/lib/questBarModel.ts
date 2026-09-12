import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import { trackDialogOpener, type DialogOpenerRef } from './dialogOpener'
import { buildMemeCardModel, type MemeCardModel } from './memeCardModel'
import type { Meme, QuestKey, QuestStep } from './types'

const QUEST_LINKS: Partial<Record<QuestKey, string>> = {
  mint: '/binder/new',
  share: '/binder',
  friend: '/friends',
  trade: '/marketplace',
}

const PACK_ID = 'pack'
const PACK_TITLE_ID = 'pack-title'

type QuestButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'disabled' | 'aria-busy'
>

export type QuestChipModel =
  | {
      kind: 'claim'
      key: QuestKey
      label: string
      /** The one-shot claim is in flight: full opacity, progress cursor, no second press. */
      busy: boolean
      buttonProps: QuestButtonProps
    }
  | {
      kind: 'step'
      key: QuestKey
      done: boolean
      title: string
      statusLabel: string
      rewardLabel: string
      rewardAriaLabel: string
      linkProps: Pick<LinkProps, 'to'> | null
    }

export interface QuestPackModel {
  /** The `DialogFrame` contract: the frame stays mounted and this is its whole truth. */
  open: boolean
  /**
   * Every dismissal Base UI recognises lands here with `false` — Escape, a press on the scrim and
   * the ✕ alike.
   */
  onOpenChange: (open: boolean) => void
  /**
   * Whatever was focused when the pack opened. A dialog opened from state has no trigger for Base
   * UI to return to on its own, so the frame is handed the opener explicitly.
   */
  opener?: DialogOpenerRef | undefined
  /** unique per dialog on the page; the frame builds its portal anchor and default ids from it */
  id: string
  titleId: string
  description: string
  cards: MemeCardModel[]
  showCards: boolean
  /** accessible name for the ✕; it is one of the dialog's two exits */
  closeLabel: string
  binderLinkProps: Pick<LinkProps, 'to' | 'onClick'>
  exploreButtonProps: QuestButtonProps
}

export interface QuestBarModel {
  visible: boolean
  showSteps: boolean
  completionLabel: string
  chips: QuestChipModel[]
  /**
   * The next actionable step's instructions, promoted out of a hover-only title. The rail lists
   * every quest inline (`732-0` › `LH4-0`), so this is the one line it carries for assistive tech
   * only — there is no hover left to hang it on.
   */
  hint: string | null
  dismissLabel: string
  dismissProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
  errorMessage: string | null
  errorProps: Pick<HTMLAttributes<HTMLSpanElement>, 'role'>
  /** Always present, never conditional: the frame owns focus restoration and needs to outlive a dismissal. */
  pack: QuestPackModel
}

export function buildQuestBarModel({
  steps,
  packMemes,
  packReward,
  busy,
  claimError = null,
  onClaimPack,
  onDismissPack,
  onDismissSteps = () => {},
}: {
  steps: QuestStep[]
  packMemes: Meme[] | null
  packReward: number
  busy: boolean
  claimError?: string | null
  onClaimPack: () => void
  onDismissPack: () => void
  onDismissSteps?: () => void
}): QuestBarModel {
  const nextIndex = steps.findIndex((step) => !step.done)
  const nextStep = nextIndex < 0 ? null : steps[nextIndex]!
  const packOpen = packMemes !== null

  return {
    visible: steps.length > 0 || packOpen,
    showSteps: steps.length > 0,
    completionLabel: `${steps.filter((step) => step.done).length}/${steps.length}`,
    /* every quest, always: both rails draw the five names in one lane (`732-0` › `LH4-0` at 1440,
       `7D0-0` › `LIQ-0` wrapped to three rows at 390), so there is nothing left to disclose */
    chips: steps.map((step): QuestChipModel => {
      if (step.key === 'pack' && !step.done) {
        return {
          kind: 'claim',
          key: step.key,
          label: busy ? 'Opening…' : `${step.title} (+${step.reward} 🧠)`,
          busy,
          buttonProps: { onClick: onClaimPack, disabled: busy, 'aria-busy': busy },
        }
      }
      const to = step.done ? null : QUEST_LINKS[step.key]
      return {
        kind: 'step',
        key: step.key,
        done: step.done,
        title: step.title,
        statusLabel: step.done ? 'Done.' : 'Not done yet.',
        rewardLabel: `+${step.reward}🧠`,
        rewardAriaLabel: `rewards ${step.reward} braincells`,
        linkProps: to ? { to } : null,
      }
    }),
    /* one line of guidance at a time: a failed claim outranks the next step's instructions */
    hint: claimError ? null : nextStep?.hint ?? null,
    dismissLabel: 'Later',
    dismissProps: { onClick: onDismissSteps, 'aria-label': 'Later — hide quests for now' },
    errorMessage: claimError,
    errorProps: { role: 'alert' },
    pack: {
      open: packOpen,
      onOpenChange: (next: boolean) => {
        if (!next) onDismissPack()
      },
      opener: trackDialogOpener(PACK_ID, packOpen),
      id: PACK_ID,
      titleId: PACK_TITLE_ID,
      description:
        packMemes && packMemes.length > 0
          ? `You now hold 10 shares in each of these — plus ${packReward} 🧠 braincells.`
          : `The vault was empty, so you got ${packReward} 🧠 braincells instead. Spend them wisely.`,
      cards: (packMemes ?? []).map(buildMemeCardModel),
      showCards: (packMemes?.length ?? 0) > 0,
      closeLabel: 'Close',
      binderLinkProps: { to: '/binder', onClick: onDismissPack },
      exploreButtonProps: { onClick: onDismissPack },
    },
  }
}
