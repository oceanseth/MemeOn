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
  imageUrl: string
  videoUrl: string
  busy: string | null
  err: string | null
  giphyCategories: string[]
  giphyQuery: string
  giphyResults: GiphyResult[]
  giphyPick: GiphyResult | null
  edited: boolean
  resolvedSource: ResolvedSource | null
  mintedId: string | null
}

export type CreateMemeEvent =
  | { type: 'SELECT_MODE'; mode: CreateMemeMode }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_TAGS'; tags: string }
  | { type: 'SET_PROMPT'; prompt: string }
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
  | { type: 'SET_GIPHY_RESULTS'; results: GiphyResult[]; emptyMessage?: string | null }
  | { type: 'SET_RESOLVED'; imageUrl: string; videoUrl: string | null; source: ResolvedSource | null }
  | { type: 'SET_EDITED_FRAME'; imageUrl: string }
  | { type: 'CLEAR_EDITED_FRAME' }
  | { type: 'SUBMIT'; busy: string }
  | { type: 'BUSY'; busy: string }
  | { type: 'DONE' }
  | { type: 'MINTED'; id: string }
  | { type: 'FAIL'; err: string }

const returnToMode = [
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'generate', target: 'generate' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'video', target: 'video' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'url', target: 'url' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'upload', target: 'upload' as const },
  { guard: ({ context }: { context: CreateMemeContext }) => context.mode === 'remix', target: 'remix' as const },
  { target: 'giphy' as const },
]

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
    imageUrl: '',
    videoUrl: '',
    busy: null,
    err: null,
    giphyCategories: [],
    giphyQuery: '',
    giphyResults: [],
    giphyPick: null,
    edited: false,
    resolvedSource: null,
    mintedId: null,
  }),
  initial: 'chooseMode',
  on: {
    SET_TITLE: { actions: assign({ title: ({ event }) => event.title }) },
    SET_TAGS: { actions: assign({ tags: ({ event }) => event.tags }) },
    SET_PROMPT: { actions: assign({ prompt: ({ event }) => event.prompt }) },
    SET_IMAGE_URL: {
      actions: assign({
        imageUrl: ({ event }) => event.imageUrl,
        edited: ({ event, context }) => event.edited ?? context.edited,
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
        title: ({ context, event }) => context.title || event.pick.title.slice(0, 20),
      }),
    },
    SET_REMIX_SOURCE: {
      actions: assign({
        remixSource: ({ event }) => event.meme,
        title: ({ context, event }) => context.title || event.meme.title.slice(0, 20),
      }),
    },
    REMIX_SOURCE_MISSING: { actions: assign({ err: 'source meme not found' }) },
    SET_GIPHY_CATEGORIES: { actions: assign({ giphyCategories: ({ event }) => event.categories }) },
    SET_GIPHY_RESULTS: {
      actions: assign({
        giphyResults: ({ event }) => event.results,
        err: ({ event }) => event.emptyMessage ?? null,
      }),
    },
    SET_RESOLVED: {
      actions: assign({
        imageUrl: ({ event }) => event.imageUrl,
        videoUrl: ({ event, context }) => event.videoUrl ?? context.videoUrl,
        resolvedSource: ({ event }) => event.source,
        edited: false,
      }),
    },
    SET_EDITED_FRAME: {
      actions: assign({
        imageUrl: ({ event }) => event.imageUrl,
        editedFrame: ({ event }) => event.imageUrl,
        videoUrl: '',
      }),
    },
    CLEAR_EDITED_FRAME: { actions: assign({ editedFrame: null }) },
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
      actions: assign({ busy: ({ event }) => event.busy, err: null }),
    },
    BUSY: { actions: assign({ busy: ({ event }) => event.busy }) },
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
        SELECT_MODE: {
          actions: assign({ mode: ({ event }) => event.mode }),
        },
        DONE: returnToMode.map((branch) => ({
          ...branch,
          actions: assign({ busy: null }),
        })),
        MINTED: {
          target: 'success',
          actions: assign({ mintedId: ({ event }) => event.id, busy: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err, busy: null }),
        },
      },
    },
    success: {},
    error: {
      on: {
        DONE: returnToMode.map((branch) => ({
          ...branch,
          actions: assign({ busy: null }),
        })),
        MINTED: {
          target: 'success',
          actions: assign({ mintedId: ({ event }) => event.id, busy: null }),
        },
        FAIL: {
          actions: assign({ err: ({ event }) => event.err, busy: null }),
        },
      },
    },
  },
})
