import { API_BASE_URL } from '@/config/env'
import { AppError, appErrorFromResponse } from '@/services/adapters/AppError'

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/** Korumalı bir istek 401 alırsa AuthProvider'ın oturumu düşürüp kullanıcıyı bilgilendirmesi için yayınlanır. */
export const UNAUTHORIZED_EVENT = 'albaverse:unauthorized'

/**
 * Django varsayılanı: CSRF token'ı "csrftoken" çerezinden okunup X-CSRFToken başlığıyla gönderilir.
 * Yöntem backend ile netleşince yalnızca bu fonksiyon değişir.
 */
export function getCsrfToken() {
  const match = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

function buildUrl(path, query) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  })
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export async function request(path, { method = 'GET', body, query, signal, expectUnauthorized = false } = {}) {
  const headers = { Accept: 'application/json' }
  const init = { method, headers, credentials: 'include', signal }

  if (body instanceof FormData) {
    init.body = body // multipart: Content-Type tarayıcı tarafından sınırla birlikte atanır
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  if (UNSAFE_METHODS.includes(method)) {
    const token = getCsrfToken()
    if (token) headers['X-CSRFToken'] = token
  }

  let response
  try {
    response = await fetch(buildUrl(path, query), init)
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new AppError({ status: 0, code: 'network_error', cause })
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = response.status === 204 || !isJson ? null : await response.json().catch(() => null)

  if (!response.ok) {
    // Giriş/oturum sorgusu gibi 401'in beklendiği isteklerde olay yayınlanmaz.
    if (response.status === 401 && !expectUnauthorized) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw appErrorFromResponse(response.status, data)
  }
  return data
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
