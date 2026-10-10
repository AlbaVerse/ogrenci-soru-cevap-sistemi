import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from './authApi'

const stub = (status = 200, body) => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
const sent = (fetchMock) => ({
  url: fetchMock.mock.calls[0][0],
  method: fetchMock.mock.calls[0][1].method,
  body: JSON.parse(fetchMock.mock.calls[0][1].body),
})

afterEach(() => vi.unstubAllGlobals())

describe('authApi (taslak sözleşme)', () => {
  it('login: e-posta ve şifreyi gönderir, kullanıcıyı eşler', async () => {
    const f = stub(200, { id: 1, email: 'a@ostimteknik.edu.tr', first_name: 'A', last_name: 'B', role: 'student' })
    const user = await authApi.login({ email: 'a@ostimteknik.edu.tr', password: 'x' })
    expect(sent(f)).toEqual({ url: '/api/v1/auth/login/', method: 'POST', body: { email: 'a@ostimteknik.edu.tr', password: 'x' } })
    expect(user.fullName).toBe('A B')
  })

  it('login: hata kodlarını AppError olarak yukarı taşır', async () => {
    stub(403, { error: { code: 'email_not_verified', message: 'Doğrulanmadı.' } })
    await expect(authApi.login({ email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      status: 403,
      code: 'email_not_verified',
    })
  })

  it('register: alanları snake_case gönderir', async () => {
    const f = stub(201, {})
    await authApi.register({ firstName: 'Ali', lastName: 'Veli', email: 'a@b.c', password: 'p', requestedRole: 'staff' })
    expect(sent(f).body).toEqual({
      first_name: 'Ali',
      last_name: 'Veli',
      email: 'a@b.c',
      password: 'p',
      requested_role: 'staff',
    })
  })

  it('verifyEmail: token veya (e-posta + kod) gönderir', async () => {
    let f = stub(200, {})
    await authApi.verifyEmail({ token: 'abc' })
    expect(sent(f).body).toEqual({ token: 'abc' })
    f = stub(200, {})
    await authApi.verifyEmail({ email: 'a@b.c', code: '123456' })
    expect(sent(f).body).toEqual({ email: 'a@b.c', code: '123456' })
  })

  it('confirmPasswordReset: uid yalnızca varsa gönderilir', async () => {
    let f = stub(200, {})
    await authApi.confirmPasswordReset({ token: 't', password: 'p' })
    expect(sent(f).body).toEqual({ token: 't', password: 'p' })
    f = stub(200, {})
    await authApi.confirmPasswordReset({ uid: 'u', token: 't', password: 'p' })
    expect(sent(f).body).toEqual({ uid: 'u', token: 't', password: 'p' })
  })

  it('updateProfile: PATCH /users/me/ ve güncel kullanıcıyı döndürür', async () => {
    const f = stub(200, { id: 1, email: 'a@b.c', first_name: 'Yeni', last_name: 'Ad' })
    const user = await authApi.updateProfile({ firstName: 'Yeni', lastName: 'Ad' })
    expect(sent(f)).toMatchObject({ url: '/api/v1/users/me/', method: 'PATCH', body: { first_name: 'Yeni', last_name: 'Ad' } })
    expect(user.fullName).toBe('Yeni Ad')
  })
})
