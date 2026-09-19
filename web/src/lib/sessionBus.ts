/**
 * Tab-scoped sessionStorage bus. `clearSession()` in lib/api.ts does not wipe it.
 * JWT lives in localStorage via lib/api.ts.
 */

/** `/binder/new` remix-video resume */
export const PENDING_VIDEO_KEY = 'memeon_pending_video'
export const getPendingVideo = (): string | null => sessionStorage.getItem(PENDING_VIDEO_KEY)
export const setPendingVideo = (value: string): void => sessionStorage.setItem(PENDING_VIDEO_KEY, value)
export const clearPendingVideo = (): void => sessionStorage.removeItem(PENDING_VIDEO_KEY)

/** `/invite/:sub` → `/auth/callback` */
export const INVITE_KEY = 'memeon_invite_from'
export const getInviteFrom = (): string | null => sessionStorage.getItem(INVITE_KEY)
export const setInviteFrom = (value: string): void => sessionStorage.setItem(INVITE_KEY, value)
export const clearInviteFrom = (): void => sessionStorage.removeItem(INVITE_KEY)

/** `/discord/link` → `/auth/callback` */
export const POST_LOGIN_KEY = 'memeon_post_login'
export const getPostLogin = (): string | null => sessionStorage.getItem(POST_LOGIN_KEY)
export const setPostLogin = (value: string): void => sessionStorage.setItem(POST_LOGIN_KEY, value)
export const clearPostLogin = (): void => sessionStorage.removeItem(POST_LOGIN_KEY)

/** `/discord/link` token across the Masky bounce */
export const DISCORD_LINK_KEY = 'memeon_discord_link_token'
export const getDiscordLinkToken = (): string | null => sessionStorage.getItem(DISCORD_LINK_KEY)
export const setDiscordLinkToken = (value: string): void => sessionStorage.setItem(DISCORD_LINK_KEY, value)
export const clearDiscordLinkToken = (): void => sessionStorage.removeItem(DISCORD_LINK_KEY)

/** `/discord/link` consent across the Masky bounce */
export const DISCORD_LINK_CONSENT_KEY = 'memeon_discord_link_consent'
export const getDiscordLinkConsent = (): string | null => sessionStorage.getItem(DISCORD_LINK_CONSENT_KEY)
export const setDiscordLinkConsent = (value: string): void =>
  sessionStorage.setItem(DISCORD_LINK_CONSENT_KEY, value)
export const clearDiscordLinkConsent = (): void => sessionStorage.removeItem(DISCORD_LINK_CONSENT_KEY)

/** landing login → `/auth/callback` */
export const MASKY_OAUTH_STATE_KEY = 'masky_oauth_state'
export const getMaskyOauthState = (): string | null => sessionStorage.getItem(MASKY_OAUTH_STATE_KEY)
export const setMaskyOauthState = (value: string): void => sessionStorage.setItem(MASKY_OAUTH_STATE_KEY, value)
export const clearMaskyOauthState = (): void => sessionStorage.removeItem(MASKY_OAUTH_STATE_KEY)
