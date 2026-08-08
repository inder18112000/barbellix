const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const ACCESS_TOKEN_KEY = 'barbellix_access_token'
const REFRESH_TOKEN_KEY = 'barbellix_refresh_token'

let accessToken: string | null = null
let refreshToken: string | null = null
let onSessionExpired: (() => void) | null = null

export function setOnSessionExpired(handler: () => void) {
  onSessionExpired = handler
}

function setTokens(tokens: { accessToken: string | null; refreshToken: string | null }) {
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
}

export function persistTokens(tokens: { accessToken: string; refreshToken: string }) {
  setTokens(tokens)
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearPersistedTokens() {
  setTokens({ accessToken: null, refreshToken: null })
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/** Reads tokens saved from a previous session - called once on app boot. */
export function loadPersistedTokens() {
  const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY)
  const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
  setTokens({ accessToken: storedAccess, refreshToken: storedRefresh })
  return { accessToken: storedAccess, refreshToken: storedRefresh }
}

async function rawRequest(path: string, options: RequestInit): Promise<Response> {
  // FormData bodies (file uploads) must NOT get an explicit Content-Type - the browser sets its
  // own multipart boundary header, and overriding it here would break the upload.
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  return fetch(`${BASE_URL}${path}`, { ...options, headers })
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false

    const data = (await res.json()) as { accessToken: string; refreshToken: string }
    persistTokens(data)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await rawRequest(path, options)

  // One retry after a successful silent refresh - if that fails too, the session is
  // genuinely over (refresh token itself expired/revoked), so log out.
  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await rawRequest(path, options)
    } else {
      clearPersistedTokens()
      onSessionExpired?.()
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error((error as { message: string }).message ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** Reuses request()'s existing 401-refresh-retry logic, just with a FormData body instead of a
   * JSON one - the only other client method that needs this today is exercise video upload. */
  uploadFile: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData }),
}
