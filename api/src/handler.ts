import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { handleRoute } from './router'

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method
  const path = event.rawPath ?? '/api'
  const result = await handleRoute(method, path)

  return {
    statusCode: result.statusCode,
    headers: result.headers,
    body: result.body,
  }
}

