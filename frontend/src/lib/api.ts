/**
 * Centralized API client that attaches Clerk auth tokens to all requests.
 * Patches the global fetch so ALL components automatically include auth headers
 * when calling the backend API — no per-component changes needed.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let _getToken: (() => Promise<string | null>) | null = null
const _originalFetch = window.fetch.bind(window)

/**
 * Initialize the API client with Clerk's getToken function.
 * Patches global fetch to auto-attach auth tokens for API requests.
 * Call this once from App.tsx after Clerk loads.
 */
export function initApiClient(getToken: () => Promise<string | null>) {
  _getToken = getToken

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const isApiCall = url.startsWith(API_URL) || url.startsWith('/api/')

    if (isApiCall && _getToken) {
      try {
        const token = await _getToken()
        if (token) {
          const headers = new Headers(init?.headers || {})
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`)
          }
          return _originalFetch(input, { ...init, headers })
        }
      } catch {
        // Proceed without auth token
      }
    }

    return _originalFetch(input, init)
  }
}

/**
 * Authenticated fetch wrapper. Automatically includes Clerk session token.
 * Falls back to unauthenticated request if token isn't available.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`
  const headers = new Headers(options.headers || {})

  // Attach auth token if available
  if (_getToken) {
    try {
      const token = await _getToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    } catch {
      // Proceed without auth token
    }
  }

  return _originalFetch(url, { ...options, headers })
}
