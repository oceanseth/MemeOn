import { act } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inviteLou, meLou } from '../../.storybook/fixtures'
import { inviteCopy } from '../copy/invite'
import { StoresProvider } from '../stores/StoresContext'
import { button, click } from '../test/dom'
import { jsonResponse, pathOf, settle, stubClipboardWrite } from '../test/runtime'
import { mountSignedInRoot, unmountSignedInRoot, type SignedInRoot } from '../test/signedInHost'
import { InviteView } from '../views/InviteView'

vi.mock('../lib/firebase', () => ({
  // auth.ts imports firebaseSignIn; the mock only exists so initializeApp never runs
  firebaseSignIn: vi.fn(),
  firebaseSignOut: vi.fn(),
}))

const copy = inviteCopy.self

let mounted: SignedInRoot
let clipboardDescriptor: PropertyDescriptor | undefined

beforeEach(async () => {
  mounted = await mountSignedInRoot()
  clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = pathOf(input)
      if (path === '/api/invite/user-lou') return jsonResponse(inviteLou)
      throw new Error(`Unexpected request: ${path}`)
    }),
  )
})

afterEach(async () => {
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
  } else {
    Reflect.deleteProperty(navigator, 'clipboard')
  }
  await unmountSignedInRoot(mounted)
})

async function renderInvite(): Promise<void> {
  await act(async () => {
    mounted.root.render(
      <StoresProvider stores={mounted.stores}>
        <MemoryRouter initialEntries={[`/invite/${meLou.sub}`]}>
          <Routes>
            <Route path="/invite/:sub" element={<InviteView />} />
          </Routes>
        </MemoryRouter>
      </StoresProvider>,
    )
    await settle()
  })
  if (!mounted.host.textContent?.includes(copy.copy)) {
    await act(async () => {
      await settle()
    })
  }
}

function expectCopyFailed(): void {
  expect(mounted.host.textContent).toContain(copy.copyFailed)
  expect(mounted.host.textContent).toContain(copy.copyFailedStatus)
  expect(mounted.host.textContent).not.toContain(copy.copied)
  expect(mounted.host.textContent).not.toContain(copy.copiedStatus)
}

describe('InviteView clipboard', () => {
  it('paints copy failed when the clipboard API is missing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    await renderInvite()
    await click(button(copy.copy, mounted.host))
    expectCopyFailed()
  })

  it('paints copy failed when clipboard has no writeText', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: {},
    })
    await renderInvite()
    await click(button(copy.copy, mounted.host))
    expectCopyFailed()
  })

  it('writes window.location.href on the clipboard receiver', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboardWrite(writeText)
    await renderInvite()
    await click(button(copy.copy, mounted.host))
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(mounted.host.textContent).toContain(copy.copied)
    expect(mounted.host.textContent).toContain(copy.copiedStatus)
    expect(mounted.host.textContent).not.toContain(copy.copyFailed)
  })

  it('paints copy failed when writeText rejects, without the error string', async () => {
    stubClipboardWrite(async () => {
      throw new Error('denied')
    })
    await renderInvite()
    await click(button(copy.copy, mounted.host))
    expectCopyFailed()
    expect(mounted.host.textContent).not.toContain('denied')
  })
})
