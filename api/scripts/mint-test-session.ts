// Dev helper: create/refresh a test user and print a session JWT for curl testing.
// Usage: TABLE_NAME=memeon-dev SSM_PREFIX=/memeon/dev npx tsx scripts/mint-test-session.ts <sub> <name>
import { ensureUser } from '../src/db'
import { issueSession } from '../src/session'

const sub = process.argv[2] ?? 'test_user_1'
const name = process.argv[3] ?? 'Test User'

const user = await ensureUser({ sub, name, picture: null })
const token = await issueSession({ sub: user.sub, name: user.name, picture: user.picture })
console.log(token)
