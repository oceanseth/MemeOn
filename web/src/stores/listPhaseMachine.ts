import { assign, setup } from 'xstate'
import type { AnyEventObject, EventObject } from 'xstate'

export const LIST_PHASES = ['loading', 'ready', 'empty', 'error'] as const
export type ListPhase = (typeof LIST_PHASES)[number]

export type ListPhaseCoreEvent =
  | { type: 'DONE' }
  | { type: 'FAIL'; err: string }
  | { type: 'RETRY' }

type ListPhaseContext = {
  err: string | null
}

/**
 * Shared loading → ready|empty|error graph. applyDone is an assign() that writes
 * the DONE payload; err is then cleared. extraOn is always-on and merged first
 * so DONE/FAIL/RETRY win. RETRY does not fetch.
 */
export function createListPhaseMachine<
  TContext extends ListPhaseContext,
  TEvent extends EventObject = ListPhaseCoreEvent,
  TInput = unknown,
>(config: {
  id: string
  context: TContext | ((args: { input: TInput }) => TContext)
  isEmpty: (args: {
    event: Extract<TEvent, { type: 'DONE' }>
    context: TContext
  }) => boolean
  applyDone: unknown
  extraOn?: object
  onRetry?: unknown
}) {
  const { id, context, isEmpty, applyDone, extraOn, onRetry } = config

  return setup({
    types: {
      context: {} as TContext,
      events: {} as AnyEventObject,
      input: {} as TInput,
    },
  }).createMachine({
    id,
    context,
    initial: 'loading',
    // extraOn + core events cannot share TransitionsConfig on a generic factory
    on: {
      ...extraOn,
      DONE: [
        {
          guard: ({
            event,
            context: ctx,
          }: {
            event: AnyEventObject
            context: TContext
          }) =>
            isEmpty({
              event: event as Extract<TEvent, { type: 'DONE' }>,
              context: ctx,
            }),
          target: '.empty',
          actions: [applyDone, assign({ err: null })],
        },
        {
          target: '.ready',
          actions: [applyDone, assign({ err: null })],
        },
      ],
      FAIL: {
        target: '.error',
        actions: assign({
          err: ({ event }) => (typeof event.err === 'string' ? event.err : null),
        }),
      },
      RETRY: {
        target: '.loading',
        actions: onRetry ?? assign({ err: null }),
      },
    } as never,
    states: {
      loading: {},
      ready: {},
      empty: {},
      error: {},
    },
  })
}
