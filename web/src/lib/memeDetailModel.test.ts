import { createActor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import { paperMeme } from '../../.storybook/fixtures'
import { memeDetailCopy as copy } from '../copy/memeDetail'
import { memeDetailMachine } from '../stores/memeDetailMachine'
import {
  buildMemeDetailModel,
  buildTierLadderModel,
  type MemeDetailModelActions,
} from './memeDetailModel'

describe('buildTierLadderModel', () => {
  it('places paper at 50% of the first rung at 5 views', () => {
    expect(buildTierLadderModel('paper', 5).value).toBe(50)
  })

  it('fills the meter at the top of the ladder', () => {
    expect(buildTierLadderModel('shiny', 41_000).value).toBe(100)
  })
})

function actions(): MemeDetailModelActions {
  return {
    onBuySharesChange: vi.fn(),
    onSellSharesChange: vi.fn(),
    onPriceChange: vi.fn(),
    onCopy: vi.fn(),
    onPlexAdd: vi.fn(),
    onPlexPickChange: vi.fn(),
    onPlexPastedChange: vi.fn(),
    onRemix: vi.fn(),
    onLogin: vi.fn(),
    onStartClaim: vi.fn(),
    onStartDelete: vi.fn(),
    onToggleVisibility: vi.fn(),
    onUnlist: vi.fn(),
    onList: vi.fn(),
    requestBuyConfirm: vi.fn(),
    runBuy: vi.fn(),
    onDeleteCancel: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onBuyCancel: vi.fn(),
    onClaimCancel: vi.fn(),
    onClaimConfirm: vi.fn(),
    onClaimNoteChange: vi.fn(),
  }
}

function detail(overrides: { copied?: boolean; copyFailed?: boolean } = {}) {
  const context = {
    ...createActor(memeDetailMachine, { input: { id: paperMeme.id } }).getSnapshot().context,
    ...overrides,
  }
  return buildMemeDetailModel({
    phase: 'ready',
    context,
    meme: paperMeme,
    user: null,
    shareUrl: `https://memeon.ai/m/${paperMeme.id}`,
    holderNameCache: new Map(),
    actions: actions(),
  })
}

describe('buildMemeDetailModel copy state', () => {
  it('plumbs copyDone and copyButtonLabel for idle, copied, and failed', () => {
    const idle = detail()
    expect(idle.copyDone).toBe(false)
    expect(idle.copyButtonLabel).toBe(copy.share.copy)

    const copied = detail({ copied: true })
    expect(copied.copyDone).toBe(true)
    expect(copied.copyButtonLabel).toBe(copy.share.copied)

    const failed = detail({ copyFailed: true })
    expect(failed.copyDone).toBe(false)
    expect(failed.copyButtonLabel).toBe(copy.share.copyFailed)
  })
})

