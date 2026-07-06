// Firebase custom-token minting via the service account (no firebase-admin SDK:
// a custom token is just an RS256 JWT signed by the service account). The client
// exchanges it with signInWithCustomToken to join our Firebase project (RTDB presence).
import { SignJWT, importPKCS8 } from 'jose'
import { getJsonSecret } from './ssm'

interface ServiceAccount {
  project_id: string
  private_key: string
  client_email: string
}

const AUD =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'

let saPromise: Promise<ServiceAccount> | null = null
const sa = () => (saPromise ??= getJsonSecret<ServiceAccount>('firebase_service_account'))

/**
 * Mint a Firebase custom token for the given uid. Returns null when the
 * service account secret isn't configured (Firebase features degrade gracefully).
 */
export async function mintFirebaseToken(
  uid: string,
  claims: Record<string, unknown> = {},
): Promise<string | null> {
  let account: ServiceAccount
  try {
    account = await sa()
  } catch {
    return null
  }
  const key = await importPKCS8(account.private_key, 'RS256')
  return new SignJWT({ uid, claims })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.client_email)
    .setSubject(account.client_email)
    .setAudience(AUD)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key)
}
