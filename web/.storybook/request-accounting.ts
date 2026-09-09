export interface UnexpectedRequest {
  method: string
  path: string
  body?: unknown
}

export class UnexpectedRequestLedger {
  readonly requests: UnexpectedRequest[] = []

  record(method: string, path: string, body?: unknown): Response {
    const request = { method: method.toUpperCase(), path, body }
    this.requests.push(request)
    return Response.json(
      { error: `Unexpected connected-story request: ${request.method} ${request.path}` },
      { status: 599 },
    )
  }

  assertEmpty(): void {
    if (this.requests.length === 0) return
    throw new Error(
      this.requests
        .map((request) => `Unexpected connected-story request: ${request.method} ${request.path}`)
        .join('\n'),
    )
  }
}

export function createRequestGuard(): UnexpectedRequestLedger {
  return new UnexpectedRequestLedger()
}
