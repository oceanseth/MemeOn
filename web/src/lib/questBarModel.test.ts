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
    expect(opening.chips[0]).toMatchObject({ kind: 'claim', label: 'Opening…', buttonProps: { disabled: true } })
    expect(done.completionLabel).toBe('1/5')
    expect(done.chips[0]).toMatchObject({ kind: 'step', done: true, linkProps: null })
  })

  it('offers task destinations only for unfinished steps', () => {
    const model = buildQuestBarModel(fresh)
    expect(model.chips.slice(1).map((chip) => chip.kind === 'step' ? chip.linkProps?.to : null))
      .toEqual(['/binder/new', '/binder', '/friends', '/marketplace'])
    const completed = buildQuestBarModel({ ...fresh, steps: questStepsFresh.map((step) => ({ ...step, done: true })) })
    expect(completed.chips.every((chip) => chip.kind === 'step' && chip.linkProps === null)).toBe(true)
    expect(completed.completionLabel).toBe('5/5')
  })

  it('keeps an empty-vault reward visible even when there are no quest steps', () => {
    const hidden = buildQuestBarModel({ ...fresh, steps: [] })
    const emptyVault = buildQuestBarModel({ ...fresh, steps: [], packMemes: [], packReward: 20 })
    expect(hidden.visible).toBe(false)
    expect(hidden.pack).toBeNull()
    expect(emptyVault.visible).toBe(true)
    expect(emptyVault.showSteps).toBe(false)
    expect(emptyVault.pack?.showCards).toBe(false)
    expect(emptyVault.pack?.description).toBe('The vault was empty, so you got 20 🧠 braincells instead. Spend them wisely.')
  })

  it('builds reward copy, card media, and binder destination for an opened pack', () => {
    const model = buildQuestBarModel({ ...fresh, packMemes: [paperMeme], packReward: 20 })
    expect(model.pack?.showCards).toBe(true)
    expect(model.pack?.description).toBe('You now hold 10 shares in each of these — plus 20 🧠 braincells.')
    expect(model.pack?.cards[0]?.detailLinkProps.to).toBe(`/m/${paperMeme.id}`)
    expect(model.pack?.cards[0]?.media).toMatchObject({ kind: 'image', imageProps: { src: paperMeme.imageUrl, alt: paperMeme.title } })
    expect(model.pack?.binderLinkProps.to).toBe('/binder')
  })
})
