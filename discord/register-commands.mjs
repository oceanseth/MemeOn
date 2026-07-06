// Register the MemeOn slash commands with Discord (run once per app / on change).
// Reads config from SSM /memeon/{ENV}/discord or DISCORD_APP_ID + DISCORD_BOT_TOKEN env.
//
//   ENV=production node discord/register-commands.mjs
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const envName = process.env.ENV ?? 'production'
let appId = process.env.DISCORD_APP_ID
let botToken = process.env.DISCORD_BOT_TOKEN

if (!appId || !botToken) {
  const ssm = new SSMClient({ region: 'us-west-2' })
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/memeon/${envName}/discord`, WithDecryption: true }),
  )
  const cfg = JSON.parse(res.Parameter.Value)
  appId = cfg.application_id
  botToken = cfg.bot_token
}

// integration_types: 0 = server install, 1 = user install
// contexts: 0 = server, 1 = bot DM, 2 = private channels/DMs
const commands = [
  {
    name: 'memeon',
    description: '🧠 Search MemeOn cards — your binder & friends first — and drop one in chat',
    options: [
      {
        type: 3, // STRING
        name: 'query',
        description: 'Search by title, tag, or creator',
        required: true,
        autocomplete: true,
      },
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },
  {
    name: 'memeon-connect',
    description: 'Link your MemeOn account so /memeon puts your memes first',
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },
]

const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
  method: 'PUT',
  headers: { authorization: `Bot ${botToken}`, 'content-type': 'application/json' },
  body: JSON.stringify(commands),
})
console.log('register commands:', res.status)
console.log(JSON.stringify(await res.json(), null, 2).slice(0, 600))
