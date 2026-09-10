import { useProjectedActor } from './useProjectedActor'
import { createElement, Fragment, useCallback, useRef } from 'react'
import type {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
} from 'react'
import { Notice } from '../atoms/Notice'
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

/** Documented ceiling (PRODUCT.md): the page shows it instead of letting the API reject a click. */
const KEY_LIMIT = 5

export interface DeveloperKeyRowModel {
  prefix: string
  label: string
  /** raw ISO for <time dateTime>, so the date is machine-readable as well as legible */
  createdAt: string
  createdLabel: string
  revokeButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
}

export type DeveloperLabelInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'maxLength' | 'aria-label'
>

export type DeveloperActionButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'disabled' | 'aria-busy'
>

/** the create button is the form's submit control, so the form owns the handler, not the button */
export type DeveloperSubmitButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled' | 'aria-busy'
>

/** persistent wrapper mounted before its text arrives, so the change is what gets announced */
export type DeveloperLiveRegionProps = Pick<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-live'>

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
  showLoadError: boolean
  showOk: boolean
  okMsg: string | null
  emptyCopy: string
  emptyHint: string
  loadingLabel: string
  loadErrorMessage: string
  quotaLabel: string | null
  quotaNote: string | null
  createLabel: string
  copyLabel: string
  copyDone: boolean
  labelInputProps: DeveloperLabelInputProps
  createFormProps: Pick<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>
  createButtonProps: DeveloperSubmitButtonProps
  copyButtonProps: DeveloperActionButtonProps
  retryButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  freshKeyProps: Pick<HTMLAttributes<HTMLDivElement>, 'tabIndex'>
  freshKeyRegionProps: DeveloperLiveRegionProps
  statusRegionProps: DeveloperLiveRegionProps
  loadingProps: DeveloperLiveRegionProps
  errorNoticeProps: Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>
  loadErrorProps: Pick<HTMLAttributes<HTMLDivElement>, 'role'>
  confirmDialog: ConfirmDialogModel
}

/** Everything `DevelopersScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDevelopersScreen(): DevelopersScreenModel {
  const [snapshot, send, actor] = useProjectedActor(developersMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as DevelopersPhase
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(() => {
    apiFetch<{ keys: KeyRow[] }>('/api/developers/keys')
      .then((r) => send({ type: 'SET_KEYS', keys: r.keys }))
      // a failed fetch is an unknown list, never an empty account
      .catch(() => send({ type: 'LOAD_FAIL' }))
  }, [send])

  useMountEffect(() => {
    load()
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  })

  const retry = useCallback(() => {
    send({ type: 'RELOAD' })
    load()
  }, [load, send])

  const onCreate = useCallback(async () => {
    const current = actor.getSnapshot().context
    // one POST per intent: a second click during a slow mint would burn a slot the user never sees
    if (current.creating || (current.keys?.length ?? 0) >= KEY_LIMIT) return
    send({ type: 'CREATE_START' })
    try {
      const out = await post<{ key: string }>('/api/developers/keys', {
        label: current.label.trim() || 'my key',
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
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(key)
    } catch {
      // insecure origin or denied permission: the key is still on screen and still selectable
      send({ type: 'FAIL', err: 'Couldn’t copy — select the key and copy it manually.' })
      return
    }
    send({ type: 'COPIED' })
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => send({ type: 'COPY_RESET' }), 2000)
  }, [actor, send])

  const onRevokeConfirm = useCallback(async () => {
    const current = actor.getSnapshot().context
    const row = current.revoking
    if (!row || current.revokeBusy) return
    send({ type: 'REVOKE_START' })
    try {
      await apiFetch(`/api/developers/keys/${row.prefix}`, { method: 'DELETE' })
    } catch {
      send({ type: 'REVOKE_FAIL', err: `Couldn’t revoke ${row.label} — try again.` })
      return
    }
    send({ type: 'REVOKE_OK', label: row.label })
    load()
  }, [actor, load, send])

  const keys = ctx.keys
  const rows = keys ?? []
  const atQuota = rows.length >= KEY_LIMIT
  const onRevokeCancel = () => send({ type: 'REVOKE_CANCEL' })
  const keyRows = keys?.map((row) => ({
    prefix: row.prefix,
    label: row.label,
    createdAt: row.createdAt,
    createdLabel: `Created ${new Date(row.createdAt).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`,
    revokeButtonProps: {
      onClick: () => send({ type: 'REVOKE', row }),
      'aria-label': `Revoke API key ${row.label}`,
    },
  }))
  const confirmDialog = buildConfirmDialogModel({
    open: !!ctx.revoking,
    danger: true,
    busy: ctx.revokeBusy,
    title: 'Revoke this API key?',
    message: createElement(
      Fragment,
      null,
      createElement('code', null, `${ctx.revoking?.prefix}…`),
      ` (${ctx.revoking?.label}) will stop working immediately. Anything using it breaks.`,
      // the page behind an open modal is inert, so the failure has to land inside the dialog
      ctx.revokeErr ? createElement(Notice, { tone: 'error' }, ctx.revokeErr) : null,
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
    showSpinner: phase === 'loading',
    showEmpty: phase === 'empty',
    showKeys: phase === 'ready' && rows.length > 0,
    showErr: !!ctx.err,
    showFreshKey: !!ctx.freshKey,
    showLoadError: phase === 'error',
    showOk: !!ctx.okMsg,
    okMsg: ctx.okMsg,
    emptyCopy: 'No keys yet — name one above and hit Generate API key.',
    emptyHint: 'You’ll see the full key exactly once, so paste it straight into your bot.',
    loadingLabel: 'Loading your API keys…',
    loadErrorMessage: 'Couldn’t reach the key list — your keys are still active.',
    quotaLabel: keys ? `${rows.length} of ${KEY_LIMIT}` : null,
    quotaNote: atQuota ? 'Key limit reached — revoke one to make room.' : null,
    createLabel: ctx.creating ? 'Generating…' : 'Generate API key',
    copyLabel: ctx.copied ? 'Copied API key' : 'Copy API key',
    copyDone: ctx.copied,
    labelInputProps: {
      value: ctx.label,
      onChange: (event) => send({ type: 'SET_LABEL', label: event.currentTarget.value }),
      maxLength: 60,
      'aria-label': 'API key label',
    },
    createFormProps: {
      onSubmit: (event) => {
        event.preventDefault()
        void onCreate()
      },
    },
    createButtonProps: {
      disabled: ctx.creating || atQuota,
      'aria-busy': ctx.creating,
    },
    copyButtonProps: {
      onClick: () => void onCopyKey(),
      disabled: !ctx.freshKey,
      'aria-busy': false,
    },
    retryButtonProps: { onClick: retry },
    freshKeyProps: { tabIndex: 0 },
    freshKeyRegionProps: { role: 'status', 'aria-live': 'polite' },
    statusRegionProps: { role: 'status', 'aria-live': 'polite' },
    loadingProps: { role: 'status', 'aria-live': 'polite' },
    errorNoticeProps: { role: 'alert' },
    loadErrorProps: { role: 'alert' },
    confirmDialog,
  }
}
