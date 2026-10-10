import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '@/services/adapters/AppError'
import { renderWithProviders } from '@/test/test-utils'
import { AppRoutes } from '@/app/AppRoutes'

vi.mock('@/services', () => ({
  authService: {
    register: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    demoHints: undefined,
  },
}))
const { authService } = await import('@/services')

// Etiket "Ad *" gibi zorunlu işaretiyle bittiği için tam eşleşme yardımcı fonksiyonla yapılır.
const field = (name) => screen.getByLabelText(new RegExp(`^${name}( \\*)?$`))
const type = (name, value) => userEvent.type(field(name), value)

beforeEach(() => vi.clearAllMocks())

describe('Giriş sayfası', () => {
  const open = (overrides) => renderWithProviders(<AppRoutes />, { route: '/giris', authOverrides: overrides })

  it('boş gönderimde alan hatalarını gösterir ve ilk hatalı alana odaklanır', async () => {
    const { auth } = open()
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    expect(await screen.findByText('E-posta adresini gir.')).toBeInTheDocument()
    expect(screen.getByText('Şifreni gir.')).toBeInTheDocument()
    await waitFor(() => expect(field('Üniversite e-posta adresi')).toHaveFocus())
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('üniversite dışı e-postayı istemcide reddeder', async () => {
    const { auth } = open()
    await type('Üniversite e-posta adresi', 'ali@gmail.com')
    await type('Şifre', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    expect(await screen.findByText(/Yalnızca @ostimteknik\.edu\.tr/)).toBeInTheDocument()
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('geçerli bilgilerle normalize edilmiş e-posta ile giriş çağrılır', async () => {
    const { auth } = open()
    auth.login.mockResolvedValue({})
    await type('Üniversite e-posta adresi', ' Ali@OstimTeknik.edu.tr ')
    await type('Şifre', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith({ email: 'ali@ostimteknik.edu.tr', password: 'Parola2026' }))
  })

  it('hatalı bilgide sunucu mesajını gösterir', async () => {
    const { auth } = open()
    auth.login.mockRejectedValue(new AppError({ status: 401, code: 'invalid_credentials', message: 'E-posta veya şifre hatalı.' }))
    await type('Üniversite e-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Şifre', 'yanlis123')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı.')
  })

  it('doğrulanmamış hesapta doğrulama sayfasına yönlendirir', async () => {
    const { auth } = open()
    auth.login.mockRejectedValue(new AppError({ status: 403, code: 'email_not_verified' }))
    await type('Üniversite e-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Şifre', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'E-postanı doğrula' })).toBeInTheDocument()
    expect(field('E-posta adresi')).toHaveValue('ali@ostimteknik.edu.tr')
  })

  it('oturum süresi dolduysa uyarı gösterir', () => {
    open({ sessionExpired: true })
    expect(screen.getByText('Oturum süren doldu')).toBeInTheDocument()
  })

  it('ağ hatasında anlaşılır mesaj gösterir ve yeniden denemeye izin verir', async () => {
    const { auth } = open()
    auth.login.mockRejectedValueOnce(new AppError({ status: 0, code: 'network_error' }))
    await type('Üniversite e-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Şifre', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sunucuya ulaşılamadı')
    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeEnabled()
  })
})

describe('Kayıt sayfası', () => {
  const open = () => renderWithProviders(<AppRoutes />, { route: '/kayit' })

  it('kullanıcı türü olarak yalnızca Öğrenci ve Personel sunar (Admin yok)', () => {
    open()
    const options = [...field('Kullanıcı türü').querySelectorAll('option')].map((o) => o.textContent)
    expect(options).toEqual(['Öğrenci', 'Personel'])
  })

  it('personel seçilince onay sürecini açıklar', async () => {
    open()
    expect(screen.queryByText('Personel yetkisi onay gerektirir')).not.toBeInTheDocument()
    await userEvent.selectOptions(field('Kullanıcı türü'), 'staff')
    expect(screen.getByText('Personel yetkisi onay gerektirir')).toBeInTheDocument()
  })

  it('geçersiz alanlar için hata gösterir ve kayıt isteği atmaz', async () => {
    open()
    await type('Ad', 'Ali')
    await type('Soyad', 'Veli')
    await type('Üniversite e-posta adresi', 'ali@gmail.com')
    await type('Şifre', 'kısa')
    await type('Şifre tekrar', 'baska')
    await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }))
    await waitFor(() =>
      expect(field('Üniversite e-posta adresi')).toHaveAccessibleDescription(/Yalnızca @ostimteknik\.edu\.tr/),
    )
    expect(field('Şifre')).toHaveAccessibleDescription(/Şifre en az 8 karakter/)
    expect(field('Şifre tekrar')).toHaveAccessibleDescription('Şifreler eşleşmiyor.')
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('başarılı kayıtta bilgileri gönderip doğrulama sayfasına geçer', async () => {
    authService.register.mockResolvedValue()
    open()
    await type('Ad', ' Ali ')
    await type('Soyad', 'Veli')
    await type('Üniversite e-posta adresi', 'Ali.Veli@ostimteknik.edu.tr')
    await type('Şifre', 'Parola2026')
    await type('Şifre tekrar', 'Parola2026')
    await userEvent.selectOptions(field('Kullanıcı türü'), 'staff')
    await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }))
    await waitFor(() =>
      expect(authService.register).toHaveBeenCalledWith({
        firstName: 'Ali',
        lastName: 'Veli',
        email: 'ali.veli@ostimteknik.edu.tr',
        password: 'Parola2026',
        requestedRole: 'staff',
      }),
    )
    expect(await screen.findByRole('heading', { level: 1, name: 'E-postanı doğrula' })).toBeInTheDocument()
    expect(screen.getByText(/Personel yetkin, e-postanı doğruladıktan sonra/)).toBeInTheDocument()
  })

  it('sunucunun alan hatasını ilgili alanda gösterir (409)', async () => {
    authService.register.mockRejectedValue(
      new AppError({ status: 409, code: 'email_taken', fields: { email: ['Bu e-posta adresiyle kayıtlı bir hesap var.'] } }),
    )
    open()
    await type('Ad', 'Ali')
    await type('Soyad', 'Veli')
    await type('Üniversite e-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Şifre', 'Parola2026')
    await type('Şifre tekrar', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }))
    expect(await screen.findByText('Bu e-posta adresiyle kayıtlı bir hesap var.')).toBeInTheDocument()
    expect(field('Üniversite e-posta adresi')).toHaveAttribute('aria-invalid', 'true')
  })

  it('çift tıklamada yalnızca bir kayıt isteği gönderir', async () => {
    let resolve
    authService.register.mockReturnValue(new Promise((r) => (resolve = r)))
    open()
    await type('Ad', 'Ali')
    await type('Soyad', 'Veli')
    await type('Üniversite e-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Şifre', 'Parola2026')
    await type('Şifre tekrar', 'Parola2026')
    const button = screen.getByRole('button', { name: 'Kayıt ol' })
    await userEvent.dblClick(button)
    expect(authService.register).toHaveBeenCalledTimes(1)
    resolve()
  })
})

describe('E-posta doğrulama (kod)', () => {
  const open = () => renderWithProviders(<AppRoutes />, { route: '/e-posta-dogrulama-bekleniyor' })

  it('geçersiz kodu istemcide reddeder', async () => {
    open()
    await type('E-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Doğrulama kodu', '12')
    await userEvent.click(screen.getByRole('button', { name: 'Kodu doğrula' }))
    expect(await screen.findByText('Altı haneli doğrulama kodunu gir.')).toBeInTheDocument()
    expect(authService.verifyEmail).not.toHaveBeenCalled()
  })

  it('doğru kodla doğrular ve giriş bağlantısı gösterir', async () => {
    authService.verifyEmail.mockResolvedValue()
    open()
    await type('E-posta adresi', 'ali@ostimteknik.edu.tr')
    await type('Doğrulama kodu', '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Kodu doğrula' }))
    await waitFor(() =>
      expect(authService.verifyEmail).toHaveBeenCalledWith({ email: 'ali@ostimteknik.edu.tr', code: '123456' }),
    )
    expect(await screen.findByText('Hesabın hazır')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Giriş yap' })).toHaveAttribute('href', '/giris')
  })

  it('yeniden gönderme sonrası bekleme süresi uygular', async () => {
    authService.resendVerification.mockResolvedValue()
    open()
    await type('E-posta adresi', 'ali@ostimteknik.edu.tr')
    await userEvent.click(screen.getByRole('button', { name: /yeniden gönder/i }))
    expect(await screen.findByText(/Yeni doğrulama e-postası gönderildi/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Yeniden gönder \(\d+ sn\)/ })).toBeDisabled()
  })
})

describe('E-posta doğrulama (bağlantı)', () => {
  it('token ile sayfa açılınca bir kez doğrulama isteği atar', async () => {
    authService.verifyEmail.mockResolvedValue()
    renderWithProviders(<AppRoutes />, { route: '/e-posta-dogrulama?token=abc' })
    expect(await screen.findByText('Hesabın hazır')).toBeInTheDocument()
    expect(authService.verifyEmail).toHaveBeenCalledTimes(1)
    expect(authService.verifyEmail).toHaveBeenCalledWith({ token: 'abc' })
  })

  it('geçersiz bağlantıda hata ve yeniden deneme yolu gösterir', async () => {
    authService.verifyEmail.mockRejectedValue(new AppError({ status: 422, message: 'Bağlantı süresi dolmuş.' }))
    renderWithProviders(<AppRoutes />, { route: '/e-posta-dogrulama?token=eski' })
    expect(await screen.findByText('Bağlantı süresi dolmuş.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Yeni doğrulama isteği/ })).toHaveAttribute('href', '/e-posta-dogrulama-bekleniyor')
  })

  it('token yoksa istek atmadan uyarı gösterir', () => {
    renderWithProviders(<AppRoutes />, { route: '/e-posta-dogrulama' })
    expect(screen.getByText('Doğrulama bağlantısı eksik')).toBeInTheDocument()
    expect(authService.verifyEmail).not.toHaveBeenCalled()
  })
})

describe('Şifre sıfırlama', () => {
  it('"şifremi unuttum" hesap varlığını belli etmeyen mesaj gösterir', async () => {
    authService.requestPasswordReset.mockResolvedValue()
    renderWithProviders(<AppRoutes />, { route: '/sifremi-unuttum' })
    await type('Üniversite e-posta adresi', 'ali@ostimteknik.edu.tr')
    await userEvent.click(screen.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }))
    expect(await screen.findByText(/adresi kayıtlıysa/)).toBeInTheDocument()
    expect(authService.requestPasswordReset).toHaveBeenCalledWith({ email: 'ali@ostimteknik.edu.tr' })
  })

  it('token olmadan sıfırlama sayfası geçersiz bağlantı uyarısı verir', () => {
    renderWithProviders(<AppRoutes />, { route: '/sifre-sifirla' })
    expect(screen.getByText('Bağlantı geçersiz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Yeni bağlantı iste' })).toHaveAttribute('href', '/sifremi-unuttum')
  })

  it('eşleşmeyen şifreleri reddeder', async () => {
    renderWithProviders(<AppRoutes />, { route: '/sifre-sifirla?token=t' })
    await type('Yeni şifre', 'Parola2026')
    await type('Yeni şifre tekrar', 'Baska2026')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi güncelle' }))
    expect(await screen.findByText('Şifreler eşleşmiyor.')).toBeInTheDocument()
    expect(authService.confirmPasswordReset).not.toHaveBeenCalled()
  })

  it('geçerli token ve şifreyle sıfırlar (uid varsa iletir)', async () => {
    authService.confirmPasswordReset.mockResolvedValue()
    renderWithProviders(<AppRoutes />, { route: '/sifre-sifirla?token=t&uid=u' })
    await type('Yeni şifre', 'Parola2026')
    await type('Yeni şifre tekrar', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi güncelle' }))
    expect(await screen.findByText('Şifren değiştirildi')).toBeInTheDocument()
    expect(authService.confirmPasswordReset).toHaveBeenCalledWith({ uid: 'u', token: 't', password: 'Parola2026' })
  })

  it('süresi dolmuş bağlantıda (400) yeni bağlantı istemeyi önerir', async () => {
    authService.confirmPasswordReset.mockRejectedValue(new AppError({ status: 400, code: 'invalid_token' }))
    renderWithProviders(<AppRoutes />, { route: '/sifre-sifirla?token=eski' })
    await type('Yeni şifre', 'Parola2026')
    await type('Yeni şifre tekrar', 'Parola2026')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi güncelle' }))
    expect(await screen.findByText('Bağlantı geçersiz')).toBeInTheDocument()
  })
})
