import { SignJWT, jwtVerify } from 'jose'
import { getSecret } from './ssm'

export interface SessionUser {
  sub: string
  name: string
  picture: string | null
}

const ISSUER = 'memeon'
const TTL = '30d'

async function key(): Promise<Uint8Array> {
  return new TextEncoder().encode(await getSecret('session_secret'))
}

export async function issueSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(await key())
}

/** Verify a Bearer session token; returns null when missing/invalid/expired. */
export async function verifySession(authHeader: string | undefined): Promise<SessionUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), await key(), { issuer: ISSUER })
    if (!payload.sub) return null
    return {
      sub: payload.sub,
      name: (payload.name as string) ?? 'Anonymous',
      picture: (payload.picture as string | null) ?? null,
    }
  } catch {
    return null
  }
}
