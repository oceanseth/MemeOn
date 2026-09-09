import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import { buildMemeCardModel, type MemeCardModel } from './memeCardModel'
import type { Meme, QuestKey, QuestStep } from './types'

const QUEST_LINKS: Partial<Record<QuestKey, string>> = {
  mint: '/binder/new',
  share: '/binder',
  friend: '/friends',
  trade: '/marketplace',
}

type QuestButtonProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>

export type QuestChipModel =
  | { kind: 'claim'; key: QuestKey; label: string; buttonProps: QuestButtonProps }
  | {
      kind: 'step'
      key: QuestKey
      done: boolean
      title: string
      rewardLabel: string
      chipProps: Pick<HTMLAttributes<HTMLSpanElement>, 'title'>
      linkProps: Pick<LinkProps, 'to' | 'title'> | null
    }

export interface QuestPackModel {
  description: string
  cards: MemeCardModel[]
  showCards: boolean
  overlayProps: Pick<HTMLAttributes<HTMLDivElement>, 'onClick'>
  modalProps: Pick<HTMLAttributes<HTMLDivElement>, 'onClick' | 'role' | 'aria-modal' | 'aria-label'>
  binderLinkProps: Pick<LinkProps, 'to'>
  binderButtonProps: QuestButtonProps
  exploreButtonProps: QuestButtonProps
}

export interface QuestBarModel {
  visible: boolean
  showSteps: boolean
  completionLabel: string
  chips: QuestChipModel[]
  pack: QuestPackModel | null
}

export function buildQuestBarModel({
  steps,
  packMemes,
  packReward,
  busy,
  onClaimPack,
  onDismissPack,
}: {
  steps: QuestStep[]
  packMemes: Meme[] | null
  packReward: number
  busy: boolean
  onClaimPack: () => void
  onDismissPack: () => void
}): QuestBarModel {
  return {
    visible: steps.length > 0 || packMemes !== null,
    showSteps: steps.length > 0,
    completionLabel: `${steps.filter((step) => step.done).length}/${steps.length}`,
    chips: steps.map((step): QuestChipModel => {
      if (step.key === 'pack' && !step.done) {
        return {
          kind: 'claim',
          key: step.key,
          label: busy ? 'Opening…' : `${step.title} (+${step.reward} 🧠)`,
          buttonProps: { onClick: onClaimPack, disabled: busy },
        }
      }
      const to = step.done ? null : QUEST_LINKS[step.key]
      return {
        kind: 'step',
        key: step.key,
        done: step.done,
        title: step.title,
        rewardLabel: `+${step.reward}🧠`,
        chipProps: { title: step.hint },
        linkProps: to ? { to, title: step.hint } : null,
      }
    }),
    pack: packMemes === null ? null : {
      description: packMemes.length > 0
        ? `You now hold 10 shares in each of these — plus ${packReward} 🧠 braincells.`
        : `The vault was empty, so you got ${packReward} 🧠 braincells instead. Spend them wisely.`,
      cards: packMemes.map(buildMemeCardModel),
      showCards: packMemes.length > 0,
      overlayProps: { onClick: onDismissPack },
      modalProps: {
        onClick: (event) => event.stopPropagation(),
        role: 'dialog',
        'aria-modal': true,
        'aria-label': 'Starter pack opened',
      },
      binderLinkProps: { to: '/binder' },
      binderButtonProps: { onClick: onDismissPack },
      exploreButtonProps: { onClick: onDismissPack },
    },
  }
}
