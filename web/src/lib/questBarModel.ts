import type {
  ButtonHTMLAttributes,
  DialogHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  RefAttributes,
} from 'react'
import type { LinkProps } from 'react-router-dom'
import { buildMemeCardModel, type MemeCardModel } from './memeCardModel'
import type { Meme, QuestKey, QuestStep } from './types'

const QUEST_LINKS: Partial<Record<QuestKey, string>> = {
  mint: '/binder/new',
  share: '/binder',
  friend: '/friends',
  trade: '/marketplace',
}

const PACK_TITLE_ID = 'pack-title'

/** The platform owns focus, Escape and inertness once the node is in the top layer. */
const openPackDialog = (node: HTMLDialogElement | null) => {
  if (node && !node.open) node.showModal()
}

type QuestButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'disabled' | 'aria-busy'
>

export type QuestChipModel =
  | { kind: 'claim'; key: QuestKey; label: string; buttonProps: QuestButtonProps }
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
  description: string
  cards: MemeCardModel[]
  showCards: boolean
  titleId: string
  dialogProps: RefAttributes<HTMLDialogElement> &
    Pick<DialogHTMLAttributes<HTMLDialogElement>, 'onClose' | 'onClick' | 'aria-labelledby'>
  closeButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
  binderLinkProps: Pick<LinkProps, 'to' | 'onClick'>
  exploreButtonProps: QuestButtonProps
}

export interface QuestBarModel {
  visible: boolean
  showSteps: boolean
  completionLabel: string
  chips: QuestChipModel[]
  /** The next actionable step's instructions, promoted out of a hover-only title. */
  hint: string | null
  expanded: boolean
  toggleLabel: string | null
  toggleProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-expanded' | 'aria-label'
  > | null
  dismissLabel: string
  dismissProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
  errorMessage: string | null
  errorProps: Pick<HTMLAttributes<HTMLSpanElement>, 'role'>
  pack: QuestPackModel | null
}

export function buildQuestBarModel({
  steps,
  packMemes,
  packReward,
  busy,
  claimError = null,
  expanded = false,
  onClaimPack,
  onDismissPack,
  onToggleSteps = () => {},
  onDismissSteps = () => {},
}: {
  steps: QuestStep[]
  packMemes: Meme[] | null
  packReward: number
  busy: boolean
  claimError?: string | null
  expanded?: boolean
  onClaimPack: () => void
  onDismissPack: () => void
  onToggleSteps?: () => void
  onDismissSteps?: () => void
}): QuestBarModel {
  const nextIndex = steps.findIndex((step) => !step.done)
  const nextStep = nextIndex < 0 ? null : steps[nextIndex]!
  const shown = expanded || !nextStep ? steps : [nextStep]
  const hiddenCount = steps.length - shown.length

  return {
    visible: steps.length > 0 || packMemes !== null,
    showSteps: steps.length > 0,
    completionLabel: `${steps.filter((step) => step.done).length}/${steps.length}`,
    chips: shown.map((step): QuestChipModel => {
      if (step.key === 'pack' && !step.done) {
        return {
          kind: 'claim',
          key: step.key,
          label: busy ? 'Opening…' : `${step.title} (+${step.reward} 🧠)`,
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
    expanded,
    toggleLabel: expanded ? 'Show less' : hiddenCount > 0 ? `${hiddenCount} more` : null,
    toggleProps:
      expanded || hiddenCount > 0
        ? {
            onClick: onToggleSteps,
            'aria-expanded': expanded,
            /* WCAG 2.5.3: the visible words lead the name, so speech input can still say them */
            'aria-label': expanded
              ? 'Show less — hide the rest of your quests'
              : `${hiddenCount} more — show all quests`,
          }
        : null,
    dismissLabel: 'Later',
    dismissProps: { onClick: onDismissSteps, 'aria-label': 'Later — hide quests for now' },
    errorMessage: claimError,
    errorProps: { role: 'alert' },
    pack: packMemes === null ? null : {
      description: packMemes.length > 0
        ? `You now hold 10 shares in each of these — plus ${packReward} 🧠 braincells.`
        : `The vault was empty, so you got ${packReward} 🧠 braincells instead. Spend them wisely.`,
      cards: packMemes.map(buildMemeCardModel),
      showCards: packMemes.length > 0,
      titleId: PACK_TITLE_ID,
      dialogProps: {
        ref: openPackDialog,
        onClose: onDismissPack,
        onClick: (event: MouseEvent<HTMLDialogElement>) => {
          if (event.target === event.currentTarget) onDismissPack()
        },
        'aria-labelledby': PACK_TITLE_ID,
      },
      closeButtonProps: { onClick: onDismissPack, 'aria-label': 'Close' },
      binderLinkProps: { to: '/binder', onClick: onDismissPack },
      exploreButtonProps: { onClick: onDismissPack },
    },
  }
}
