import { useMachine } from '@xstate/react'
import { useCallback } from 'react'
import { apiFetch, post } from '../lib/api'
import {
  developersMachine,
  type DevelopersPhase,
  type KeyRow,
} from '../stores/developersMachine'
import { useMountEffect } from './useMountEffect'

export type { KeyRow }

export interface DevelopersScreenModel {
  phase: DevelopersPhase
  keys: KeyRow[] | null
  label: string
  freshKey: string | null
  revoking: KeyRow | null
  err: string | null
  copied: boolean
  showSpinner: boolean
  showEmpty: boolean
  showKeys: boolean
  showErr: boolean
  showFreshKey: boolean
  showRevoke: boolean
  copyLabel: string
  onLabelChange: (label: string) => void
  onCreate: () => void
  onCopyKey: () => void
  onRevoke: (row: KeyRow) => void
  onRevokeCancel: () => void
  onRevokeConfirm: () => void
}

/** Everything `DevelopersScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDevelopersScreen(): DevelopersScreenModel {
  const [snapshot, send, actor] = useMachine(developersMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as DevelopersPhase

  const load = useCallback(() => {
    apiFetch<{ keys: KeyRow[] }>('/api/developers/keys')
      .then((r) => send({ type: 'SET_KEYS', keys: r.keys }))
      .catch(() => send({ type: 'SET_KEYS', keys: [] }))
  }, [send])

  useMountEffect(() => {
    load()
  })

  const onCreate = useCallback(async () => {
    const label = actor.getSnapshot().context.label
    try {
      const out = await post<{ key: string }>('/api/developers/keys', {
        label: label.trim() || 'my key',
      })
      send({ type: 'CREATED', key: out.key })
      load()
    } catch (e) {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'key creation failed' })
    }
  }, [actor, load, send])

  const onCopyKey = useCallback(async () => {
    const key = actor.getSnapshot().context.freshKey
    if (!key) return
    await navigator.clipboard.writeText(key)
    send({ type: 'COPIED' })
    setTimeout(() => send({ type: 'COPY_RESET' }), 2000)
  }, [actor, send])

  const onRevokeConfirm = useCallback(async () => {
    const row = actor.getSnapshot().context.revoking
    if (!row) return
    await apiFetch(`/api/developers/keys/${row.prefix}`, { method: 'DELETE' }).catch(() => {})
    send({ type: 'REVOKED' })
    load()
  }, [actor, load, send])

  const keys = ctx.keys

  return {
    phase,
    keys,
    label: ctx.label,
    freshKey: ctx.freshKey,
    revoking: ctx.revoking,
    err: ctx.err,
    copied: ctx.copied,
    showSpinner: keys === null,
    showEmpty: keys !== null && keys.length === 0,
    showKeys: keys !== null && keys.length > 0,
    showErr: !!ctx.err,
    showFreshKey: !!ctx.freshKey,
    showRevoke: !!ctx.revoking,
    copyLabel: ctx.copied ? 'Copied ✓' : 'Copy key',
    onLabelChange: (label) => send({ type: 'SET_LABEL', label }),
    onCreate: () => void onCreate(),
    onCopyKey: () => void onCopyKey(),
    onRevoke: (row) => send({ type: 'REVOKE', row }),
    onRevokeCancel: () => send({ type: 'REVOKE_CANCEL' }),
    onRevokeConfirm: () => void onRevokeConfirm(),
  }
}
