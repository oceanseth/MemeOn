import { http, passthrough } from 'msw'
import { getActiveScenario } from './connected-scenario'

export const connectedHandlers = [
  http.all('*', ({ request }) => {
    const url = new URL(request.url)
    if (url.origin === 'https://uploads.example.test') return getActiveScenario().handle(request)
    if (!url.pathname.startsWith('/api/') || url.pathname.startsWith('/api/brand/')) return passthrough()
    return getActiveScenario().handle(request)
  }),
]
