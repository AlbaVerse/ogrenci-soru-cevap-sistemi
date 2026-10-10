import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/AppRoutes'
import { AppError } from '@/services/adapters/AppError'
import { demoUser, renderWithProviders } from '@/test/test-utils'

vi.mock('@/services', () => ({
  authService: { updateProfile: vi.fn(), changePassword: vi.fn(), demoHints: undefined },
}))
const { authService } = await import('@/services')

const field = (name) => screen.getByLabelText(new RegExp(`^${name}( \\*)?$`))
const open = (key = 'student') => renderWithProviders(<AppRoutes />, { route: '/profil', user: demoUser(key) })

beforeEach(() => vi.clearAllMocks())

describe('Profil sayfası', () => {
  it('hesap bilgilerini ve rolü gösterir', () => {
    open()
    expect(screen.getByRole('heading', { level: 1, name: 'Profil ve Ayarlar' })).toBeInTheDocument()
    expect(field('E-posta adresi')).toHaveValue('irem.kaya@ostimteknik.edu.tr')
    expect(field('E-posta adresi')).toHaveAttribute('readonly')
    expect(screen.getAllByText('Öğrenci').length).toBeGreaterThan(0)
  })

  it('onay bekleyen personelin durumunu açıkça gösterir', () => {
    open('pendingStaff')
    expect(screen.getByText('Personel başvurun inceleniyor')).toBeInTheDocument()
    // Kabuktaki ince şerit de aynı durumu belirtir.
    expect(screen.getByText(/Personel başvurun yönetici onayı bekliyor/)).toBeInTheDocument()
  })

  it('onaylanmış personelde onay mesajı gösterilir, bekleme şeridi görünmez', () => {
    open('staff')
    expect(screen.getByText('Personel yetkin onaylandı')).toBeInTheDocument()
    expect(screen.queryByText(/yönetici onayı bekliyor/i)).not.toBeInTheDocument()
  })

  it('adı değiştirip kaydeder ve bağlamdaki kullanıcıyı günceller', async () => {
    const { auth } = open()
    const updated = { ...demoUser('student'), firstName: 'İremsu', fullName: 'İremsu Kaya' }
    authService.updateProfile.mockResolvedValue(updated)
    expect(screen.getByRole('button', { name: 'Değişiklikleri kaydet' })).toBeDisabled()
    await userEvent.clear(field('Ad'))
    await userEvent.type(field('Ad'), 'İremsu')
    await userEvent.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }))
    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalledWith({ firstName: 'İremsu', lastName: 'Kaya' }))
    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith(updated))
    expect(await screen.findByText('Profil bilgilerin güncellendi.')).toBeInTheDocument()
  })

  it('boş adı kaydetmez', async () => {
    open()
    await userEvent.clear(field('Ad'))
    await userEvent.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }))
    expect(await screen.findByText('Ad alanı zorunludur.')).toBeInTheDocument()
    expect(authService.updateProfile).not.toHaveBeenCalled()
  })

  it('tema tercihini değiştirir', async () => {
    open()
    await userEvent.click(screen.getByRole('radio', { name: 'Koyu' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('albaverse.theme')).toBe('dark')
  })

  it('şifre değiştirmede eşleşmeyen şifreyi reddeder', async () => {
    open()
    await userEvent.type(field('Mevcut şifre'), 'Demo1234!')
    await userEvent.type(field('Yeni şifre'), 'YeniParola1')
    await userEvent.type(field('Yeni şifre tekrar'), 'Baska1234')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }))
    expect(await screen.findByText('Şifreler eşleşmiyor.')).toBeInTheDocument()
    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it('şifreyi değiştirir ve alanları temizler', async () => {
    authService.changePassword.mockResolvedValue()
    open()
    await userEvent.type(field('Mevcut şifre'), 'Demo1234!')
    await userEvent.type(field('Yeni şifre'), 'YeniParola1')
    await userEvent.type(field('Yeni şifre tekrar'), 'YeniParola1')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }))
    await waitFor(() =>
      expect(authService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Demo1234!', newPassword: 'YeniParola1' }),
    )
    expect(await screen.findByText('Şifren değiştirildi.')).toBeInTheDocument()
    expect(field('Mevcut şifre')).toHaveValue('')
  })

  it('sunucunun "mevcut şifre hatalı" cevabını alanda gösterir', async () => {
    authService.changePassword.mockRejectedValue(
      new AppError({ status: 422, fields: { current_password: ['Mevcut şifre hatalı.'] } }),
    )
    open()
    await userEvent.type(field('Mevcut şifre'), 'yanlis')
    await userEvent.type(field('Yeni şifre'), 'YeniParola1')
    await userEvent.type(field('Yeni şifre tekrar'), 'YeniParola1')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }))
    expect(await screen.findByText('Mevcut şifre hatalı.')).toBeInTheDocument()
  })

  it('çıkış yap düğmesi logout çağırır', async () => {
    const { auth } = open()
    await userEvent.click(screen.getAllByRole('button', { name: 'Çıkış yap' }).at(-1))
    expect(auth.logout).toHaveBeenCalled()
  })
})
