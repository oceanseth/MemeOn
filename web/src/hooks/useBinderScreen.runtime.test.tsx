import { act } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { StoresProvider } from '../stores/StoresContext'
import { jsonResponse, pathOf } from '../test/runtime'
import { mountSignedInRoot, unmountSignedInRoot, type SignedInRoot } from '../test/signedInHost'
import { useBinderScreen, type BinderScreenModel } from './useBinderScreen'

let mounted: SignedInRoot
let model!: BinderScreenModel
let search = ''

function Probe() {
  model = useBinderScreen()
  search = useLocation().search
  return null
}

function query(): URLSearchParams {
  return new URLSearchParams(search)
}

beforeEach(async () => {
  mounted = await mountSignedInRoot()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = pathOf(input)
      if (path === '/api/binder') return jsonResponse({ memes: [] })
      throw new Error(`Unexpected request: ${path}`)
    }),
  )
})

afterEach(async () => {
  await unmountSignedInRoot(mounted)
})

async function renderAt(entry: string): Promise<void> {
  await act(() => {
    mounted.root.render(
      <StoresProvider stores={mounted.stores}>
        <MemoryRouter initialEntries={[entry]}>
          <Probe />
        </MemoryRouter>
      </StoresProvider>,
    )
  })
}

it('round-trips newest ascending and a views flip through the binder query', async () => {
  await renderAt('/binder?sort=new&dir=asc')
  expect(model.sortChips.selected).toBe('new')
  expect(model.sortChips.direction).toBe('asc')

  await act(() => {
    model.sortChips.flip()
  })
  expect(query().has('sort')).toBe(false)
  expect(query().has('dir')).toBe(false)

  await act(() => {
    model.sortChips.flip()
  })
  expect(query().get('sort')).toBe('new')
  expect(query().get('dir')).toBe('asc')

  await act(() => {
    model.sortChips.select('views')
  })
  expect(query().get('sort')).toBe('views')
  expect(query().has('dir')).toBe(false)

  await act(() => {
    model.sortChips.flip()
  })
  expect(query().get('sort')).toBe('views')
  expect(query().get('dir')).toBe('asc')
})

it('keeps newest descending when the query is only dir=asc', async () => {
  await renderAt('/binder?dir=asc')
  expect(model.sortChips.selected).toBe('new')
  expect(model.sortChips.direction).toBe('desc')
  expect(query().has('sort')).toBe(false)
  expect(query().get('dir')).toBe('asc')
})

it('keeps private=1 when newest flips to ascending', async () => {
  await renderAt('/binder?private=1')
  await act(() => {
    model.sortChips.flip()
  })
  expect(query().get('sort')).toBe('new')
  expect(query().get('dir')).toBe('asc')
  expect(query().get('private')).toBe('1')
})
