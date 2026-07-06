// Deploy Realtime Database security rules for presence using the service
// account stored in SSM (/memeon/production/firebase_service_account).
// Usage: AWS_REGION=us-west-2 npx tsx scripts/deploy-rtdb-rules.ts
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { SignJWT, importPKCS8 } from 'jose'

const RTDB = 'https://memeon-8ab5f-default-rtdb.firebaseio.com'

const RULES = {
  rules: {
    '.read': false,
    '.write': false,
    presence: {
      '.read': 'auth != null',
      $uid: {
        '.write': 'auth != null && auth.uid === $uid',
      },
    },
  },
}

const ssm = new SSMClient({})
const res = await ssm.send(
  new GetParameterCommand({
    Name: process.env.SA_PARAM ?? '/memeon/production/firebase_service_account',
    WithDecryption: true,
  }),
)
const sa = JSON.parse(res.Parameter!.Value!) as {
  client_email: string
  private_key: string
  token_uri: string
}

// service-account OAuth2 flow: signed JWT assertion -> access token
const key = await importPKCS8(sa.private_key, 'RS256')
const assertion = await new SignJWT({
  scope:
    'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
})
  .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
  .setIssuer(sa.client_email)
  .setAudience(sa.token_uri)
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(key)

const tokenRes = await fetch(sa.token_uri, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }),
})
const token = ((await tokenRes.json()) as { access_token?: string }).access_token
if (!token) throw new Error('failed to get access token')

const put = await fetch(`${RTDB}/.settings/rules.json`, {
  method: 'PUT',
  headers: { authorization: `Bearer ${token}` },
  body: JSON.stringify(RULES, null, 2),
})
console.log('rules deploy:', put.status, await put.text())
