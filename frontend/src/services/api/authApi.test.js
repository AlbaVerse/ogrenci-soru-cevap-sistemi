import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from './authApi'

const respond = (status, body) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      }),
    ),
  )

afterEach(() => vi.unstubAllGlobals())

describe('authApi.getSession', () => {
  it('oturum varsa kullanıcıyı eşler', async () => {
    respond(200, { id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@ostimteknik.edu.tr', role: 'staff' })
    expect(await authApi.getSession()).toMatchObject({ fullName: 'Ada Lovelace', role: 'staff' })
  })

  it('{ user: {...} } sarmalını da kabul eder', async () => {
    respond(200, { user: { id: 1, email: 'a@ostimteknik.edu.tr' } })
    expect((await authApi.getSession()).email).toBe('a@ostimteknik.edu.tr')
  })

  it.each([401, 403])('%i yanıtını "oturum yok" sayar', async (status) => {
    respond(status, { error: { code: 'not_authenticated' } })
    expect(await authApi.getSession()).toBeNull()
  })

  it('sunucu hatasını yukarı fırlatır', async () => {
    respond(500)
    await expect(authApi.getSession()).rejects.toMatchObject({ status: 500 })
  })

  it('anlamsız gövdede invalid_response hatası verir', async () => {
    respond(200, { foo: 'bar' })
    await expect(authApi.getSession()).rejects.toMatchObject({ code: 'invalid_response' })
  })
})
