import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { signOut, signInWithCustomToken } = vi.hoisted(() => ({
  signOut: vi.fn(),
  signInWithCustomToken: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithCustomToken,
  signOut,
}))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
}))

import { firebaseSignIn, firebaseSignOut } from './firebase'

describe('firebaseSignOut', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    signOut.mockReset()
    signInWithCustomToken.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs and does not throw when signOut rejects', async () => {
    const err = new Error('auth disabled')
    signOut.mockRejectedValue(err)

    expect(() => firebaseSignOut()).not.toThrow()
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('[memeon firebase] sign-out failed', err)
    })
  })

  it('does not log when signOut resolves', async () => {
    signOut.mockResolvedValue(undefined)

    firebaseSignOut()
    await Promise.resolve()
    expect(console.error).not.toHaveBeenCalled()
  })
})

describe('firebaseSignIn', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    signOut.mockReset()
    signInWithCustomToken.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('still rejects so the caller decides', async () => {
    const err = new Error('auth disabled')
    signInWithCustomToken.mockRejectedValue(err)

    await expect(firebaseSignIn('custom-token')).rejects.toBe(err)
    expect(console.error).not.toHaveBeenCalled()
  })
})
