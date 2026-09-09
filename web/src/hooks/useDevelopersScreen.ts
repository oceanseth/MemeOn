import { useProjectedActor } from './useProjectedActor'
import { createElement, Fragment, useCallback } from 'react'
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
} from 'react'
import { apiFetch, post } from '../lib/api'
import {
  buildConfirmDialogModel,
  type ConfirmDialogModel,
} from '../lib/confirmDialogModel'
import {
  developersMachine,
  type DevelopersPhase,
  type KeyRow,
} from '../stores/developersMachine'
import { useMountEffect } from './useMountEffect'

export type { KeyRow }

export interface DeveloperKeyRowModel {
  prefix: string
  label: string
  createdLabel: string
  revokeButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
}

export type DeveloperLabelInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'maxLength' | 'aria-label'
>

export type DeveloperActionButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'disabled' | 'aria-busy' | 'aria-label'
>

export interface DevelopersScreenModel {
  phase: DevelopersPhase
  keys: DeveloperKeyRowModel[] | null
  freshKey: string | null
  err: string | null
  showSpinner: boolean
  showEmpty: boolean
  showKeys: boolean
  showErr: boolean
  showFreshKey: boolean
  copyLabel: string
  labelInputProps: DeveloperLabelInputProps
  createButtonProps: DeveloperActionButtonProps
  copyButtonProps: DeveloperActionButtonProps
  errorNoticeProps: Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>
  confirmDialog: ConfirmDialogModel
}

/** Everything `DevelopersScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDevelopersScreen(): DevelopersScreenModel {
  const [snapshot, send, actor] = useProjectedActor(developersMachine)
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
  const onRevokeCancel = () => send({ type: 'REVOKE_CANCEL' })
  const keyRows = keys?.map((row) => ({
    prefix: row.prefix,
    label: row.label,
    createdLabel: new Date(row.createdAt).toLocaleDateString(),
    revokeButtonProps: {
      onClick: () => send({ type: 'REVOKE', row }),
      'aria-label': `Revoke API key ${row.label}`,
    },
  }))
  const confirmDialog = buildConfirmDialogModel({
    open: !!ctx.revoking,
    danger: true,
    title: 'Revoke this API key?',
    message: createElement(
      Fragment,
      null,
      createElement('code', null, `${ctx.revoking?.prefix}…`),
      ` (${ctx.revoking?.label}) will stop working immediately. Anything using it breaks.`,
    ),
    confirmLabel: 'Revoke it',
    onCancel: onRevokeCancel,
    onConfirm: () => void onRevokeConfirm(),
  })

  return {
    phase,
    keys: keyRows ?? null,
    freshKey: ctx.freshKey,
    err: ctx.err,
    showSpinner: keys === null,
    showEmpty: keys !== null && keys.length === 0,
    showKeys: keys !== null && keys.length > 0,
    showErr: !!ctx.err,
    showFreshKey: !!ctx.freshKey,
    copyLabel: ctx.copied ? 'Copied ✓' : 'Copy key',
    labelInputProps: {
      value: ctx.label,
      onChange: (event) => send({ type: 'SET_LABEL', label: event.currentTarget.value }),
      maxLength: 60,
      'aria-label': 'API key label',
    },
    createButtonProps: {
      onClick: () => void onCreate(),
      disabled: false,
      'aria-busy': false,
      'aria-label': 'Generate API key',
    },
    copyButtonProps: {
      onClick: () => void onCopyKey(),
      disabled: !ctx.freshKey,
      'aria-busy': false,
      'aria-label': 'Copy API key',
    },
    errorNoticeProps: { role: 'alert' },
    confirmDialog,
  }
}
