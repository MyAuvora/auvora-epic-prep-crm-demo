/**
 * Centralized API client that attaches Clerk auth tokens to all requests.
 * Use `apiClient.fetch()` instead of raw `fetch()` for authenticated calls.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let _getToken: (() => Promise<string | null>) | null = null

/**
 * Initialize the API client with Clerk's getToken function.
 * Call this once from App.tsx after Clerk loads.
 */
export function initApiClient(getToken: () => Promise<string | null>) {
  _getToken = getToken
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

  return fetch(url, { ...options, headers })
}
