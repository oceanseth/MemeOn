import { assign, setup } from 'xstate'
import type { GiphyResult, Meme } from '../lib/types'

export type CreateMemeMode = 'generate' | 'video' | 'url' | 'upload' | 'remix' | 'giphy'

export type CreateMemePhase =
  | 'chooseMode'
  | CreateMemeMode
  | 'submitting'
  | 'success'
  | 'error'

export type RemixOutput = 'image' | 'video'
export type VideoRemixStyle = 'edit' | 'restyle'

export interface ResolvedSource {
  provider: string
  id: string
  url: string
  author: string | null
}

export interface CreateMemeInput {
  remixId: string | null
}

/** Card banners hold 20 characters. Counted as graphemes so an emoji is never cut in half. */
export const TITLE_MAX = 20

const graphemesOf = (value: string): string[] =>
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)].map(
        (part) => part.segment,
      )
    : [...value]

export const countTitle = (value: string): number => graphemesOf(value).length

export const boundTitle = (value: string): string => {
  const parts = graphemesOf(value)
  return parts.length <= TITLE_MAX ? value : parts.slice(0, TITLE_MAX).join('')
}

/** The typed part of a draft that survives a reload while a render is pending. */
export interface CreateMemeDraft {
  mode: CreateMemeMode
  title: string
  tags: string
  prompt: string
  motionPrompt: string
  remixOutput: RemixOutput
  videoUrl: string
}

export interface CreateMemeContext {
  remixId: string | null
  mode: CreateMemeMode
  remixSource: Meme | null
  remixOutput: RemixOutput
  videoMode: VideoRemixStyle
  motionPrompt: string
  editedFrame: string | null
  title: string
  tags: string
  prompt: string
  /** what the user typed in URL mode; only promoted to imageUrl once it resolves */
  urlDraft: string
  imageUrl: string
  videoUrl: string
  busy: string | null
  /** live "1m04s" counter for the running job, never part of the busy sentence */
  busyElapsed: string | null
  err: string | null
  giphyCategories: string[]
  giphyQuery: string
  giphyResults: GiphyResult[]
  giphySearched: boolean
  giphyPick: GiphyResult | null
  edited: boolean
  /** provenance of the artwork itself, so attribution survives a mode switch */
  artworkSource: ResolvedSource | null
  mintedId: string | null
  shareUrl: string
  shareCopied: boolean
}

export type CreateMemeEvent =
  | { type: 'SELECT_MODE'; mode: CreateMemeMode }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_TAGS'; tags: string }
  | { type: 'SET_PROMPT'; prompt: string }
  | { type: 'SET_URL_DRAFT'; urlDraft: string }
  | { type: 'SET_IMAGE_URL'; imageUrl: string; edited?: boolean }
  | { type: 'SET_VIDEO_URL'; videoUrl: string }
  | { type: 'SET_REMIX_OUTPUT'; remixOutput: RemixOutput }
  | { type: 'SET_VIDEO_MODE'; videoMode: VideoRemixStyle }
  | { type: 'SET_MOTION_PROMPT'; motionPrompt: string }
  | { type: 'SET_GIPHY_QUERY'; query: string }
  | { type: 'PICK_GIPHY'; pick: GiphyResult }
  | { type: 'SET_REMIX_SOURCE'; meme: Meme }
  | { type: 'REMIX_SOURCE_MISSING' }
  | { type: 'SET_GIPHY_CATEGORIES'; categories: string[] }
  | { type: 'SET_GIPHY_RESULTS'; results: GiphyResult[] }
  | { type: 'SET_RESOLVED'; imageUrl: string; videoUrl: string | null; source: ResolvedSource | null }
  | { type: 'SET_EDITED_FRAME'; imageUrl: string }
  | { type: 'CLEAR_EDITED_FRAME' }
  | { type: 'RESTORE_DRAFT'; draft: Partial<CreateMemeDraft> }
  | { type: 'SUBMIT'; busy: string }
  | { type: 'BUSY'; busy: string }
  | { type: 'TICK'; elapsed: string }
  | { type: 'DONE' }
  | { type: 'MINTED'; id: string; shareUrl: string }
  | { type: 'SHARE_COPIED' }
  | { type: 'FAIL'; err: string }

const returnToMode = [
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'generate', target: 'generate' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'video', target: 'video' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'url', target: 'url' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'upload', target: 'upload' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'remix', target: 'remix' as const },
  { target: 'giphy' as const },
]

const settleBusy = { busy: null, busyElapsed: null } as const

/**
 * Mint flow source of truth. chooseMode → a mode → submitting → success|error.
 * The hook drives async work and sends events; do not add React state here.
 */
export const createMemeMachine = setup({
  types: {
    context: {} as CreateMemeContext,
    events: {} as CreateMemeEvent,
    input: {} as CreateMemeInput,
  },
}).createMachine({
  id: 'createMeme',
  context: ({ input }) => ({
    remixId: input.remixId,
    mode: input.remixId ? 'remix' : 'generate',
    remixSource: null,
    remixOutput: 'image',
    videoMode: 'edit',
    motionPrompt: '',
    editedFrame: null,
    title: '',
    tags: '',
    prompt: '',
    urlDraft: '',
    imageUrl: '',
    videoUrl: '',
    busy: null,
    busyElapsed: null,
    err: null,
    giphyCategories: [],
    giphyQuery: '',
    giphyResults: [],
    giphySearched: false,
    giphyPick: null,
    edited: false,
    artworkSource: null,
    mintedId: null,
    shareUrl: '',
    shareCopied: false,
  }),
  initial: 'chooseMode',
  on: {
    SET_TITLE: { actions: assign({ title: ({ event }) => event.title }) },
    SET_TAGS: { actions: assign({ tags: ({ event }) => event.tags }) },
    SET_PROMPT: { actions: assign({ prompt: ({ event }) => event.prompt }) },
    SET_URL_DRAFT: { actions: assign({ urlDraft: ({ event }) => event.urlDraft }) },
    /* new artwork of unknown origin: any carried-over attribution dies with the old image */
    SET_IMAGE_URL: {
      actions: assign({
        imageUrl: ({ event }) => event.imageUrl,
        edited: ({ event, context }) => event.edited ?? context.edited,
        artworkSource: null,
      }),
    },
    SET_VIDEO_URL: { actions: assign({ videoUrl: ({ event }) => event.videoUrl }) },
    SET_REMIX_OUTPUT: { actions: assign({ remixOutput: ({ event }) => event.remixOutput }) },
    SET_VIDEO_MODE: { actions: assign({ videoMode: ({ event }) => event.videoMode }) },
    SET_MOTION_PROMPT: { actions: assign({ motionPrompt: ({ event }) => event.motionPrompt }) },
    SET_GIPHY_QUERY: { actions: assign({ giphyQuery: ({ event }) => event.query }) },
    PICK_GIPHY: {
      actions: assign({
        giphyPick: ({ event }) => event.pick,
        imageUrl: ({ event }) => event.pick.gifUrl,
        edited: false,
        artworkSource: ({ event }) => ({
          provider: 'giphy',
          id: event.pick.id,
          url: event.pick.url,
          author: event.pick.author,
        }),
        title: ({ context, event }) => context.title || boundTitle(event.pick.title),
      }),
    },
    SET_REMIX_SOURCE: {
      actions: assign({
        remixSource: ({ event }) => event.meme,
        title: ({ context, event }) => context.title || boundTitle(event.meme.title),
      }),
    },
    REMIX_SOURCE_MISSING: { actions: assign({ err: 'source meme not found' }) },
    SET_GIPHY_CATEGORIES: { actions: assign({ giphyCategories: ({ event }) => event.categories }) },
    /* zero results is an empty state, not an error: the panel reports it, the notice does not */
    SET_GIPHY_RESULTS: {
      actions: assign({
        giphyResults: ({ event }) => event.results,
        giphySearched: true,
      }),
    },
    SET_RESOLVED: {
      actions: assign({
        imageUrl: ({ event }) => event.imageUrl,
        videoUrl: ({ event, context }) => event.videoUrl ?? context.videoUrl,
        artworkSource: ({ event }) => event.source,
        edited: false,
      }),
    },
    SET_EDITED_FRAME: {
      actions: assign({
        imageUrl: ({ event }) => event.imageUrl,
        editedFrame: ({ event }) => event.imageUrl,
        artworkSource: null,
        videoUrl: '',
      }),
    },
    CLEAR_EDITED_FRAME: { actions: assign({ editedFrame: null }) },
    RESTORE_DRAFT: {
      actions: assign(({ context, event }) => ({ ...context, ...event.draft })),
    },
    SELECT_MODE: [
      {
        guard: ({ event }) => event.mode === 'generate',
        target: '.generate',
        actions: assign({ mode: 'generate' }),
      },
      {
        guard: ({ event }) => event.mode === 'video',
        target: '.video',
        actions: assign({ mode: 'video' }),
      },
      {
        guard: ({ event }) => event.mode === 'url',
        target: '.url',
        actions: assign({ mode: 'url' }),
      },
      {
        guard: ({ event }) => event.mode === 'upload',
        target: '.upload',
        actions: assign({ mode: 'upload' }),
      },
      {
        guard: ({ event }) => event.mode === 'remix',
        target: '.remix',
        actions: assign({ mode: 'remix' }),
      },
      {
        target: '.giphy',
        actions: assign({ mode: 'giphy' }),
      },
    ],
    SUBMIT: {
      target: '.submitting',
      actions: assign({ busy: ({ event }) => event.busy, busyElapsed: null, err: null }),
    },
    BUSY: { actions: assign({ busy: ({ event }) => event.busy }) },
    TICK: { actions: assign({ busyElapsed: ({ event }) => event.elapsed }) },
    /* a rejection raised before any request (an over-cap file) reports in place, without a busy flash */
    FAIL: { actions: assign({ err: ({ event }) => event.err, ...settleBusy }) },
  },
  states: {
    chooseMode: {
      always: [
        { guard: ({ context }) => !!context.remixId, target: 'remix' },
        { target: 'generate' },
      ],
    },
    generate: {},
    video: {},
    url: {},
    upload: {},
    remix: {},
    giphy: {},
    submitting: {
      on: {
        /* the form is locked while a job runs: a queued mode tap must not reshape it mid-request */
        SELECT_MODE: { actions: [] },
        DONE: returnToMode.map((branch) => ({
          ...branch,
          actions: assign(settleBusy),
        })),
        MINTED: {
          target: 'success',
          actions: assign({
            mintedId: ({ event }) => event.id,
            shareUrl: ({ event }) => event.shareUrl,
            ...settleBusy,
          }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err, ...settleBusy }),
        },
      },
    },
    success: {
      on: {
        SHARE_COPIED: { actions: assign({ shareCopied: true }) },
      },
    },
    error: {
      on: {
        DONE: returnToMode.map((branch) => ({
          ...branch,
          actions: assign(settleBusy),
        })),
        MINTED: {
          target: 'success',
          actions: assign({
            mintedId: ({ event }) => event.id,
            shareUrl: ({ event }) => event.shareUrl,
            ...settleBusy,
          }),
        },
        FAIL: {
          actions: assign({ err: ({ event }) => event.err, ...settleBusy }),
        },
      },
    },
  },
})
