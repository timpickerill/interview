export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message)
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiRequestError(0, 'Network error. Check your connection and try again.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiRequestError(res.status, body?.error ?? `Request failed (${res.status})`, body?.fields)
  }
  return body as T
}
