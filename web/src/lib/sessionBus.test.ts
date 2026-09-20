import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubSessionStorage } from '../test/runtime'
import {
  clearDiscordLinkConsent,
  clearDiscordLinkToken,
  clearInviteFrom,
  clearMaskyOauthState,
  clearPendingVideo,
  clearPostLogin,
  DISCORD_LINK_CONSENT_KEY,
  DISCORD_LINK_KEY,
  getDiscordLinkConsent,
  getDiscordLinkToken,
  getInviteFrom,
  getMaskyOauthState,
  getPendingVideo,
  getPostLogin,
  INVITE_KEY,
  MASKY_OAUTH_STATE_KEY,
  PENDING_VIDEO_KEY,
  POST_LOGIN_KEY,
  setDiscordLinkConsent,
  setDiscordLinkToken,
  setInviteFrom,
  setMaskyOauthState,
  setPendingVideo,
  setPostLogin,
} from './sessionBus'

const KEYS = [
  PENDING_VIDEO_KEY,
  INVITE_KEY,
  POST_LOGIN_KEY,
  DISCORD_LINK_KEY,
  DISCORD_LINK_CONSENT_KEY,
  MASKY_OAUTH_STATE_KEY,
] as const

describe('sessionBus', () => {
  beforeEach(() => {
    stubSessionStorage()
    sessionStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('spells six unique key literals', () => {
    expect(KEYS).toEqual([
      'memeon_pending_video',
      'memeon_invite_from',
      'memeon_post_login',
      'memeon_discord_link_token',
      'memeon_discord_link_consent',
      'masky_oauth_state',
    ])
    expect(new Set(KEYS).size).toBe(6)
  })

  it('get/set/clear round-trip pending video', () => {
    expect(getPendingVideo()).toBeNull()
    setPendingVideo('{"generationId":"gen-a"}')
    expect(getPendingVideo()).toBe('{"generationId":"gen-a"}')
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toBe('{"generationId":"gen-a"}')
    clearPendingVideo()
    expect(getPendingVideo()).toBeNull()
  })

  it('get/set/clear round-trip invite from', () => {
    expect(getInviteFrom()).toBeNull()
    setInviteFrom('inviter-sub')
    expect(getInviteFrom()).toBe('inviter-sub')
    expect(sessionStorage.getItem(INVITE_KEY)).toBe('inviter-sub')
    clearInviteFrom()
    expect(getInviteFrom()).toBeNull()
  })

  it('get/set/clear round-trip post login', () => {
    expect(getPostLogin()).toBeNull()
    setPostLogin('/discord/link')
    expect(getPostLogin()).toBe('/discord/link')
    expect(sessionStorage.getItem(POST_LOGIN_KEY)).toBe('/discord/link')
    clearPostLogin()
    expect(getPostLogin()).toBeNull()
  })

  it('get/set/clear round-trip discord link token', () => {
    expect(getDiscordLinkToken()).toBeNull()
    setDiscordLinkToken('link-token')
    expect(getDiscordLinkToken()).toBe('link-token')
    expect(sessionStorage.getItem(DISCORD_LINK_KEY)).toBe('link-token')
    clearDiscordLinkToken()
    expect(getDiscordLinkToken()).toBeNull()
  })

  it('get/set/clear round-trip discord link consent', () => {
    expect(getDiscordLinkConsent()).toBeNull()
    setDiscordLinkConsent('1')
    expect(getDiscordLinkConsent()).toBe('1')
    expect(sessionStorage.getItem(DISCORD_LINK_CONSENT_KEY)).toBe('1')
    clearDiscordLinkConsent()
    expect(getDiscordLinkConsent()).toBeNull()
  })

  it('get/set/clear round-trip masky oauth state', () => {
    expect(getMaskyOauthState()).toBeNull()
    setMaskyOauthState('state-uuid')
    expect(getMaskyOauthState()).toBe('state-uuid')
    expect(sessionStorage.getItem(MASKY_OAUTH_STATE_KEY)).toBe('state-uuid')
    clearMaskyOauthState()
    expect(getMaskyOauthState()).toBeNull()
  })
})
