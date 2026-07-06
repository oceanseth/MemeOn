import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { env } from './env'

const client = new SSMClient({})
const cache = new Map<string, Promise<string>>()

/** Read a SecureString SSM parameter under the env prefix, decrypted and cached per warm Lambda. */
export function getSecret(name: string): Promise<string> {
  const full = `${env.ssmPrefix}/${name}`
  let p = cache.get(full)
  if (!p) {
    p = client
      .send(new GetParameterCommand({ Name: full, WithDecryption: true }))
      .then((res) => {
        const v = res.Parameter?.Value
        if (!v) throw new Error(`SSM parameter ${full} has no value`)
        return v
      })
      .catch((err) => {
        cache.delete(full) // don't cache failures
        throw err
      })
    cache.set(full, p)
  }
  return p
}

export async function getJsonSecret<T = unknown>(name: string): Promise<T> {
  return JSON.parse(await getSecret(name)) as T
}

export interface MaskyOAuthConfig {
  authorize_url: string
  token_url: string
  userinfo_url: string
  client_id: string
  client_secret: string
  scopes: string
}

// Stable Masky OAuth endpoints (https://masky.ai/skill.md). The SSM param
// `masky_oauth` only needs { client_id, client_secret } and may override these.
const MASKY_OAUTH_DEFAULTS = {
  authorize_url: 'https://masky.ai/oauth-authorize.html',
  token_url: 'https://masky.ai/api/oauth/token',
  userinfo_url: 'https://masky.ai/api/oauth/userinfo',
  scopes: 'profile avatars:read generate',
}

export async function getMaskyOAuth(): Promise<MaskyOAuthConfig> {
  const v = await getJsonSecret<Partial<MaskyOAuthConfig>>('masky_oauth')
  return { ...MASKY_OAUTH_DEFAULTS, ...v } as MaskyOAuthConfig
}
