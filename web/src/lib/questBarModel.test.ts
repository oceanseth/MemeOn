import { describe, expect, it, vi } from 'vitest'
import { paperMeme, questStepsFresh, questStepsPackDone } from '../../.storybook/fixtures'
import { buildQuestBarModel } from './questBarModel'

const fresh = {
  steps: questStepsFresh,
  packMemes: null,
  packReward: 0,
  busy: false,
  onClaimPack: vi.fn(),
  onDismissPack: vi.fn(),
}

describe('buildQuestBarModel', () => {
  it('builds claim availability and the completion label from quest state', () => {
    const freshModel = buildQuestBarModel(fresh)
    const opening = buildQuestBarModel({ ...fresh, busy: true })
    const done = buildQuestBarModel({ ...fresh, steps: questStepsPackDone })
    expect(freshModel.completionLabel).toBe('0/5')
    expect(freshModel.chips[0]).toMatchObject({ kind: 'claim', buttonProps: { disabled: false } })
    expect(opening.chips[0]).toMatchObject({
      kind: 'claim',
      label: 'Opening…',
      busy: true,
      buttonProps: { disabled: true, 'aria-busy': true },
    })
    expect(done.completionLabel).toBe('1/5')
    expect(buildQuestBarModel({ ...fresh, steps: questStepsPackDone }).chips[0])
      .toMatchObject({ kind: 'step', done: true, linkProps: null })
  })

  it('lists every quest inline and keeps the next step\u2019s instructions on the rail', () => {
    /* both boards draw the whole ladder (`732-0` \u203a `LH4-0` in one row, `7D0-0` \u203a `LIQ-0`
       wrapped to three): there is no disclosure left, so the rail never carries fewer than five */
    const packDone = buildQuestBarModel({ ...fresh, steps: questStepsPackDone })
    expect(packDone.chips).toHaveLength(5)
    expect(packDone.chips[1]).toMatchObject({ kind: 'step', key: 'mint', done: false })
    expect(packDone.hint).toBe(questStepsPackDone[1]!.hint)

    const finished = buildQuestBarModel({
      ...fresh,
      steps: questStepsFresh.map((step) => ({ ...step, done: true })),
    })
    expect(finished.chips).toHaveLength(5)
    expect(finished.hint).toBeNull()
  })

  it('names each step state and reward without relying on a glyph or a hover', () => {
    const model = buildQuestBarModel({ ...fresh, steps: questStepsPackDone })
    expect(model.chips[0]).toMatchObject({
      kind: 'step',
      statusLabel: 'Done.',
      rewardAriaLabel: 'rewards 20 braincells',
    })
    expect(model.chips[1]).toMatchObject({
      kind: 'step',
      statusLabel: 'Not done yet.',
      rewardLabel: '+100🧠',
      rewardAriaLabel: 'rewards 100 braincells',
    })
    expect(model.dismissProps['aria-label']).toBe('Later — hide quests for now')
  })

  it('offers task destinations only for unfinished steps', () => {
    const model = buildQuestBarModel(fresh)
    expect(model.chips.slice(1).map((chip) => chip.kind === 'step' ? chip.linkProps?.to : null))
      .toEqual(['/binder/new', '/binder', '/friends', '/marketplace'])
    const completed = buildQuestBarModel({
      ...fresh,
      steps: questStepsFresh.map((step) => ({ ...step, done: true })),
    })
    expect(completed.chips.every((chip) => chip.kind === 'step' && chip.linkProps === null)).toBe(true)
    expect(completed.completionLabel).toBe('5/5')
  })

  it('surfaces a failed one-shot claim instead of returning to the button', () => {
    const failed = buildQuestBarModel({ ...fresh, claimError: "Pack didn't open — tap to try again." })
    expect(failed.errorMessage).toBe("Pack didn't open — tap to try again.")
    expect(failed.errorProps.role).toBe('alert')
    expect(buildQuestBarModel(fresh).errorMessage).toBeNull()
  })

  it('keeps an empty-vault reward visible even when there are no quest steps', () => {
    const hidden = buildQuestBarModel({ ...fresh, steps: [] })
    const emptyVault = buildQuestBarModel({ ...fresh, steps: [], packMemes: [], packReward: 20 })
    expect(hidden.visible).toBe(false)
    /* the frame is always modelled, never conditional: it owns focus restoration, so it has to
       outlive the dismissal that closes it */
    expect(hidden.pack.open).toBe(false)
    expect(hidden.pack.cards).toEqual([])
    expect(emptyVault.visible).toBe(true)
    expect(emptyVault.showSteps).toBe(false)
    expect(emptyVault.pack.open).toBe(true)
    expect(emptyVault.pack.showCards).toBe(false)
    expect(emptyVault.pack.description).toBe('The vault was empty, so you got 20 🧠 braincells instead. Spend them wisely.')
  })

  it('builds reward copy, card media, and a single-element binder exit for an opened pack', () => {
    const model = buildQuestBarModel({ ...fresh, packMemes: [paperMeme], packReward: 20 })
    expect(model.pack.open).toBe(true)
    expect(model.pack.showCards).toBe(true)
    expect(model.pack.description).toBe('You now hold 10 shares in each of these — plus 20 🧠 braincells.')
    expect(model.pack.cards[0]?.detailLinkProps.to).toBe(`/m/${paperMeme.id}`)
    // the card's title and link already name it; the image is decorative inside the pack too
    expect(model.pack.cards[0]?.media).toMatchObject({ kind: 'image', imageProps: { src: paperMeme.imageUrl, alt: '' } })
    expect(model.pack.binderLinkProps.to).toBe('/binder')
    expect(model.pack.id).toBe('pack')
    expect(model.pack.titleId).toBe('pack-title')
    expect(model.pack.closeLabel).toBe('Close')
  })

  it('reports every Base UI dismissal as one call to the parent, and never a re-open', () => {
    const onDismissPack = vi.fn()
    const model = buildQuestBarModel({ ...fresh, onDismissPack, packMemes: [paperMeme], packReward: 20 })
    model.pack.onOpenChange(false)
    expect(onDismissPack).toHaveBeenCalledTimes(1)
    // only the engine opens the pack; a stray `true` from the frame is not a claim
    model.pack.onOpenChange(true)
    expect(onDismissPack).toHaveBeenCalledTimes(1)
  })
})
