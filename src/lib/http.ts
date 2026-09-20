import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message)
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new ApiError(400, message, fields)
export const notFound = (message: string) => new ApiError(404, message)
export const conflict = (message: string, fields?: Record<string, string>) =>
  new ApiError(409, message, fields)

// Wraps a handler so thrown ApiErrors become JSON and anything else becomes a
// generic 500 (details go to the server log, never to the client).
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<NextResponse>) {
  return async (...args: A) => {
    try {
      return await fn(...args)
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: e.message, fields: e.fields }, { status: e.status })
      }
      console.error(e)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw badRequest('Request body must be valid JSON')
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object')
  }
  return body as Record<string, unknown>
}
