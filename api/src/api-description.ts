export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'

export interface ApiEndpointDescription {
  method: HttpMethod
  path: string
  description: string
  exampleResponse?: string
}

export const apiDescription: ApiEndpointDescription[] = [
  {
    method: 'GET',
    path: '/api/helloworld',
    description: 'Returns the string "helloworld". Useful as a quick connectivity smoke test.',
    exampleResponse: 'helloworld',
  },
]

