import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '@/services/adapters/AppError'
import { http, UNAUTHORIZED_EVENT } from './httpClient'

const jsonResponse = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  })

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('httpClient', () => {
  it('çerezleri gönderir ve API ön ekini kullanır', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    await http.get('/auth/me/')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/me/')
    expect(init.credentials).toBe('include')
  })

  it('güvenli olmayan isteklere CSRF başlığı ekler, GET isteğine eklemez', async () => {
    document.cookie = 'csrftoken=abc123'
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)
    await http.post('/auth/logout/')
    await http.get('/auth/me/')
    expect(fetchMock.mock.calls[0][1].headers['X-CSRFToken']).toBe('abc123')
    expect(fetchMock.mock.calls[1][1].headers['X-CSRFToken']).toBeUndefined()
  })

  it('FormData gövdesinde Content-Type başlığını elle ayarlamaz', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, {}))
    vi.stubGlobal('fetch', fetchMock)
    await http.post('/admin/documents/', new FormData())
    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBeUndefined()
  })

  it('hata gövdesini AppError biçimine çevirir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(422, { error: { code: 'validation', message: 'Geçersiz.', fields: { email: ['Zorunlu'] } } }),
      ),
    )
    const error = await http.post('/x/', {}).catch((e) => e)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ status: 422, code: 'validation', message: 'Geçersiz.', fields: { email: ['Zorunlu'] } })
  })

  it('gövdesiz hata yanıtında durum koduna uygun Türkçe mesaj üretir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(403)))
    const error = await http.get('/x/').catch((e) => e)
    expect(error.status).toBe(403)
    expect(error.message).toMatch(/yetkin yok/)
  })

  it('ağ hatasını network_error olarak bildirir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = await http.get('/x/').catch((e) => e)
    expect(error).toMatchObject({ status: 0, code: 'network_error' })
  })

  it('204 yanıtında null döner', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    expect(await http.delete('/x/1/')).toBeNull()
  })

  it('korumalı istek 401 alırsa oturum süresi olayı yayınlar', async () => {
    const listener = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401)))
    await http.get('/conversations/').catch(() => {})
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(UNAUTHORIZED_EVENT, listener)
  })

  it('401 beklenen isteklerde (giriş vb.) olay yayınlamaz', async () => {
    const listener = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401)))
    await http.post('/auth/login/', {}, { expectUnauthorized: true }).catch(() => {})
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener(UNAUTHORIZED_EVENT, listener)
  })

  it('403 yanıtında oturum süresi olayı yayınlamaz', async () => {
    const listener = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(403)))
    await http.get('/admin/users/').catch(() => {})
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener(UNAUTHORIZED_EVENT, listener)
  })
})
