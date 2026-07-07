import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import './routes'
import { HttpError, json, matchRoute, type Req } from './http'
import { verifySession, type SessionUser } from './session'

const cors: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, x-masky-token',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}

export async function dispatch(input: {
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  rawBody: string | undefined
}): Promise<APIGatewayProxyStructuredResultV2> {
  const method = input.method.toUpperCase()
  if (method === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }

  const match = matchRoute(method, input.path)
  if (!match) {
    return withCors(json(404, { error: `no route for ${method} ${input.path}` }))
  }

  let body: Record<string, unknown> = {}
  if (input.rawBody) {
    try {
      body = JSON.parse(input.rawBody) as Record<string, unknown>
    } catch {
      /* keep {} */
    }
  }

  let user: SessionUser | null = null
  if (match.auth) {
    user = await verifySession(input.headers.authorization)
    if (!user) return withCors(json(401, { error: 'login required' }))
  }

  const req: Req = {
    method,
    path: input.path,
    query: input.query,
    headers: input.headers,
    body,
    rawBody: input.rawBody ?? '',
    params: match.params,
    user: user ?? { sub: '', name: '', picture: null },
  }

  try {
    return withCors(await match.handler(req))
  } catch (err) {
    if (err instanceof HttpError) return withCors(json(err.statusCode, { error: err.message }))
    console.error('unhandled route error', { path: input.path, err })
    return withCors(json(500, { error: 'internal error' }))
  }
}

function withCors(res: {
  statusCode: number
  headers: Record<string, string>
  body: string
}): APIGatewayProxyStructuredResultV2 {
  return { ...res, headers: { ...cors, ...res.headers } }
}

export async function handler(
  event: APIGatewayProxyEventV2 & { action?: string; max?: number; inventoryTarget?: number },
): Promise<APIGatewayProxyStructuredResultV2 | Record<string, unknown>> {
  // scheduled invocations (EventBridge) carry an action instead of an http request
  if (event.action === 'giphy-seed') {
    const { runGiphySeed } = await import('./seeder')
    const result = await runGiphySeed({ max: event.max, inventoryTarget: event.inventoryTarget })
    console.log('giphy-seed run', result)
    return result
  }

  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(event.headers ?? {})) {
    if (v !== undefined) headers[k.toLowerCase()] = v
  }
  return dispatch({
    method: event.requestContext.http.method,
    path: event.rawPath ?? '/',
    query: (event.queryStringParameters ?? {}) as Record<string, string>,
    headers,
    rawBody: event.isBase64Encoded && event.body
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body,
  })
}
