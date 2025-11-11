import type { ApiEndpointDescription, HttpMethod } from './api-description'
import { apiDescription } from './api-description'

export interface RouteResult {
  statusCode: number
  headers: Record<string, string>
  body: string
}

type RouteHandler = () => Promise<RouteResult> | RouteResult

const baseHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
}

const routes = new Map<string, RouteHandler>([
  [
    routeKey('GET', '/api/helloworld'),
    () => ({
      statusCode: 200,
      headers: {
        ...baseHeaders,
        'content-type': 'text/plain; charset=utf-8',
      },
      body: 'helloworld',
    }),
  ],
])

export async function handleRoute(method: string, rawPath: string): Promise<RouteResult> {
  const normalizedMethod = normalizeMethod(method)
  const normalizedPath = normalizePath(rawPath)
  const key = routeKey(normalizedMethod, normalizedPath)

  const handler = routes.get(key)

  if (handler) {
    return handler()
  }

  return describeApi()
}

function describeApi(): RouteResult {
  return {
    statusCode: 200,
    headers: {
      ...baseHeaders,
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(
      {
        message: 'Available MemeOn API endpoints',
        endpoints: apiDescription,
      },
      null,
      2,
    ),
  }
}

function normalizePath(path: string): string {
  if (!path) return '/'

  const trimmed = path.trim()
  if (trimmed === '') return '/'

  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1)
  }

  return trimmed
}

function normalizeMethod(method: string): HttpMethod {
  const upper = method.toUpperCase()
  if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(upper)) {
    return upper as HttpMethod
  }
  return 'GET'
}

function routeKey(method: HttpMethod | string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`
}

export function getApiDescription(): ApiEndpointDescription[] {
  return apiDescription
}

