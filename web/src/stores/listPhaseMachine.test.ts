import { assign, createActor } from 'xstate'
import { expect, it } from 'vitest'
import {
  LIST_PHASES,
  createListPhaseMachine,
  type ListPhase,
  type ListPhaseCoreEvent,
} from './listPhaseMachine'

type ToyContext = {
  items: string[]
  visibleLimit: number
  err: string | null
}

type ToyEvent =
  | { type: 'DONE'; items: string[] }
  | { type: 'FAIL'; err: string }
  | { type: 'RETRY' }
  | { type: 'SHOW_MORE' }

const PAGE = 2

const toyContext: ToyContext = { items: [], visibleLimit: PAGE, err: null }

const extraOn = {
  SHOW_MORE: {
    actions: assign({
      visibleLimit: ({ context }: { context: ToyContext }) => context.visibleLimit + PAGE,
    }),
  },
}

const applyDone = assign({
  items: ({ event }: { event: Extract<ToyEvent, { type: 'DONE' }> }) => event.items,
})

function defaultMachine() {
  return createListPhaseMachine<ToyContext, ToyEvent>({
    id: 'toy-list',
    context: toyContext,
    isEmpty: ({ event }) => event.items.length === 0,
    applyDone,
    extraOn,
  })
}

function neverEmptyMachine() {
  return createListPhaseMachine<ToyContext, ToyEvent>({
    id: 'toy-never-empty',
    context: toyContext,
    isEmpty: () => false,
    applyDone,
    extraOn,
  })
}

function retryResetsLimitMachine() {
  return createListPhaseMachine<ToyContext, ToyEvent>({
    id: 'toy-retry-limit',
    context: toyContext,
    isEmpty: ({ event }) => event.items.length === 0,
    applyDone,
    extraOn,
    onRetry: assign({ err: null, visibleLimit: PAGE }),
  })
}

function start(machine: ReturnType<typeof defaultMachine>) {
  return createActor(machine).start()
}

it('starts in loading with err null', () => {
  const actor = start(defaultMachine())
  const snap = actor.getSnapshot()
  const phase: ListPhase = snap.value as ListPhase

  expect(phase).toBe('loading')
  expect(snap.context.err).toBeNull()
  expect(LIST_PHASES[0]).toBe('loading')
  actor.stop()
})

it('DONE + isEmpty true goes to empty', () => {
  const actor = start(defaultMachine())

  actor.send({ type: 'DONE', items: [] })

  expect(actor.getSnapshot().value).toBe('empty')
  expect(actor.getSnapshot().context.items).toEqual([])
  expect(actor.getSnapshot().context.err).toBeNull()
  actor.stop()
})

it('DONE + isEmpty false goes to ready and replaces the payload', () => {
  const actor = start(defaultMachine())

  actor.send({ type: 'DONE', items: ['a'] })
  actor.send({ type: 'DONE', items: ['b', 'c'] })

  expect(actor.getSnapshot().value).toBe('ready')
  expect(actor.getSnapshot().context.items).toEqual(['b', 'c'])
  expect(actor.getSnapshot().context.err).toBeNull()
  actor.stop()
})

it('isEmpty: () => false + DONE with an empty payload goes to ready', () => {
  const actor = start(neverEmptyMachine())

  actor.send({ type: 'DONE', items: [] })

  expect(actor.getSnapshot().value).toBe('ready')
  expect(actor.getSnapshot().context.items).toEqual([])
  actor.stop()
})

it('FAIL goes to error with event.err and keeps prior list fields', () => {
  const actor = start(defaultMachine())

  actor.send({ type: 'DONE', items: ['card'] })
  actor.send({ type: 'SHOW_MORE' })
  const fail: ListPhaseCoreEvent = { type: 'FAIL', err: 'offline' }
  actor.send(fail)

  const snap = actor.getSnapshot()
  expect(snap.value).toBe('error')
  expect(snap.context.err).toBe('offline')
  expect(snap.context.items).toEqual(['card'])
  expect(snap.context.visibleLimit).toBe(PAGE * 2)
  actor.stop()
})

it('default RETRY from error goes to loading, clears err, and leaves visibleLimit', () => {
  const actor = start(defaultMachine())

  actor.send({ type: 'DONE', items: ['card'] })
  actor.send({ type: 'SHOW_MORE' })
  actor.send({ type: 'FAIL', err: 'offline' })
  actor.send({ type: 'RETRY' })

  const snap = actor.getSnapshot()
  expect(snap.value).toBe('loading')
  expect(snap.context.err).toBeNull()
  expect(snap.context.visibleLimit).toBe(PAGE * 2)
  expect(snap.context.items).toEqual(['card'])
  actor.stop()
})

it('custom onRetry can reset visibleLimit', () => {
  const actor = start(retryResetsLimitMachine())

  actor.send({ type: 'DONE', items: ['card'] })
  actor.send({ type: 'SHOW_MORE' })
  actor.send({ type: 'FAIL', err: 'offline' })
  actor.send({ type: 'RETRY' })

  const snap = actor.getSnapshot()
  expect(snap.value).toBe('loading')
  expect(snap.context.err).toBeNull()
  expect(snap.context.visibleLimit).toBe(PAGE)
  actor.stop()
})

it('extraOn SHOW_MORE does not change phase', () => {
  const actor = start(defaultMachine())

  actor.send({ type: 'SHOW_MORE' })
  expect(actor.getSnapshot().value).toBe('loading')
  expect(actor.getSnapshot().context.visibleLimit).toBe(PAGE * 2)

  actor.send({ type: 'DONE', items: ['card'] })
  actor.send({ type: 'SHOW_MORE' })
  expect(actor.getSnapshot().value).toBe('ready')
  expect(actor.getSnapshot().context.visibleLimit).toBe(PAGE * 3)
  actor.stop()
})

it('empty and error are distinct', () => {
  expect(LIST_PHASES.includes('empty')).toBe(true)
  expect(LIST_PHASES.includes('error')).toBe(true)
  expect('empty').not.toBe('error')

  const emptyActor = start(defaultMachine())
  emptyActor.send({ type: 'DONE', items: [] })
  const errorActor = start(defaultMachine())
  errorActor.send({ type: 'FAIL', err: 'offline' })

  expect(emptyActor.getSnapshot().value).toBe('empty')
  expect(errorActor.getSnapshot().value).toBe('error')
  expect(emptyActor.getSnapshot().value).not.toBe(errorActor.getSnapshot().value)
  expect(errorActor.getSnapshot().context.err).toBe('offline')
  expect(emptyActor.getSnapshot().context.err).toBeNull()
  emptyActor.stop()
  errorActor.stop()
})
