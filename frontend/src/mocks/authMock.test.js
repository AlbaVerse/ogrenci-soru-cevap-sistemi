import { beforeEach, describe, expect, it } from 'vitest'
import { authMock } from './authMock'
import { DEMO_PASSWORD, DEMO_VERIFICATION_CODE } from './data/users'

const NEW = {
  firstName: 'Ali',
  lastName: 'Veli',
  email: 'ali.veli@ostimteknik.edu.tr',
  password: 'Parola2026',
  requestedRole: 'student',
}

beforeEach(() => authMock.resetDemo())

describe('authMock: giriş', () => {
  it('demo hesapla giriş yapar ve oturumu hatırlar', async () => {
    const user = await authMock.login({ email: 'IREM.KAYA@ostimteknik.edu.tr', password: DEMO_PASSWORD })
    expect(user.role).toBe('student')
    expect((await authMock.getSession()).email).toBe('irem.kaya@ostimteknik.edu.tr')
    await authMock.logout()
    expect(await authMock.getSession()).toBeNull()
  })

  it('yanlış parola ve bilinmeyen e-posta aynı hatayı verir (hesap varlığı sızmaz)', async () => {
    const wrong = await authMock.login({ email: 'irem.kaya@ostimteknik.edu.tr', password: 'yanlis' }).catch((e) => e)
    const unknown = await authMock.login({ email: 'yok@ostimteknik.edu.tr', password: 'yanlis' }).catch((e) => e)
    expect(wrong).toMatchObject({ status: 401, code: 'invalid_credentials' })
    expect(unknown).toMatchObject({ status: 401, code: 'invalid_credentials' })
    expect(wrong.message).toBe(unknown.message)
  })

  it('oturum süresi dolunca oturum bilgisi kalkar', async () => {
    await authMock.login({ email: 'irem.kaya@ostimteknik.edu.tr', password: DEMO_PASSWORD })
    authMock.expireSession()
    expect(await authMock.getSession()).toBeNull()
  })
})

describe('authMock: kayıt ve e-posta doğrulama', () => {
  it('doğrulanmadan giriş reddedilir, doğrulayınca giriş yapılır', async () => {
    await authMock.register(NEW)
    await expect(authMock.login(NEW)).rejects.toMatchObject({ status: 403, code: 'email_not_verified' })

    await expect(authMock.verifyEmail({ email: NEW.email, code: '000000' })).rejects.toMatchObject({ status: 422 })
    await authMock.verifyEmail({ email: NEW.email, code: DEMO_VERIFICATION_CODE })

    const user = await authMock.login(NEW)
    expect(user).toMatchObject({ role: 'student', emailVerified: true, staffApprovalStatus: null })
  })

  it('doğrulama bağlantısı (token) ile de doğrulanır', async () => {
    await authMock.register(NEW)
    const token = new URL(authMock.demoHints.verifyLink(NEW.email), 'http://x').searchParams.get('token')
    await authMock.verifyEmail({ token })
    expect((await authMock.login(NEW)).emailVerified).toBe(true)
  })

  it('personel kaydı: aktif rol öğrenci, istenen rol personel, durum beklemede', async () => {
    await authMock.register({ ...NEW, requestedRole: 'staff' })
    await authMock.verifyEmail({ email: NEW.email, code: DEMO_VERIFICATION_CODE })
    const user = await authMock.login(NEW)
    expect(user).toMatchObject({ role: 'student', requestedRole: 'staff', staffApprovalStatus: 'pending' })
  })

  it('istemciden admin rolü istenemez', async () => {
    await authMock.register({ ...NEW, requestedRole: 'admin' })
    await authMock.verifyEmail({ email: NEW.email, code: DEMO_VERIFICATION_CODE })
    expect((await authMock.login(NEW)).role).toBe('student')
    expect((await authMock.getSession()).requestedRole).toBe('student')
  })

  it('aynı e-posta ikinci kez kaydedilemez (409)', async () => {
    await authMock.register(NEW)
    await expect(authMock.register(NEW)).rejects.toMatchObject({ status: 409, fields: { email: expect.any(Array) } })
  })

  it('üniversite dışı e-postayı sunucu tarafında da reddeder (422)', async () => {
    await expect(authMock.register({ ...NEW, email: 'ali@gmail.com' })).rejects.toMatchObject({
      status: 422,
      fields: { email: expect.any(Array) },
    })
  })
})

describe('authMock: şifre işlemleri', () => {
  it('sıfırlama bağlantısıyla şifre değişir', async () => {
    const email = 'irem.kaya@ostimteknik.edu.tr'
    const token = new URL(authMock.demoHints.resetLink(email), 'http://x').searchParams.get('token')
    await authMock.confirmPasswordReset({ token, password: 'YeniParola1' })
    await expect(authMock.login({ email, password: DEMO_PASSWORD })).rejects.toMatchObject({ status: 401 })
    expect((await authMock.login({ email, password: 'YeniParola1' })).email).toBe(email)
  })

  it('geçersiz sıfırlama bağlantısı 400 verir', async () => {
    await expect(authMock.confirmPasswordReset({ token: 'sahte', password: 'YeniParola1' })).rejects.toMatchObject({
      status: 400,
      code: 'invalid_token',
    })
  })

  it('şifre değiştirirken mevcut şifreyi doğrular', async () => {
    await authMock.login({ email: 'irem.kaya@ostimteknik.edu.tr', password: DEMO_PASSWORD })
    await expect(authMock.changePassword({ currentPassword: 'x', newPassword: 'YeniParola1' })).rejects.toMatchObject({
      status: 422,
      fields: { current_password: expect.any(Array) },
    })
    await authMock.changePassword({ currentPassword: DEMO_PASSWORD, newPassword: 'YeniParola1' })
    await authMock.logout()
    expect((await authMock.login({ email: 'irem.kaya@ostimteknik.edu.tr', password: 'YeniParola1' })).role).toBe('student')
  })

  it('profil güncelleme oturumdaki kullanıcıyı değiştirir', async () => {
    await authMock.login({ email: 'irem.kaya@ostimteknik.edu.tr', password: DEMO_PASSWORD })
    const updated = await authMock.updateProfile({ firstName: 'İremsu', lastName: 'Kaya' })
    expect(updated.fullName).toBe('İremsu Kaya')
    expect((await authMock.getSession()).firstName).toBe('İremsu')
  })
})
