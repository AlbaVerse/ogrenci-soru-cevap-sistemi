import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { demoUser, renderWithProviders } from '@/test/test-utils'
import { AppRoutes } from './AppRoutes'

describe('AppRoutes', () => {
  it('giriş yapmamış kullanıcıyı giriş sayfasına yönlendirir', () => {
    renderWithProviders(<AppRoutes />, { route: '/sohbet' })
    expect(screen.getByRole('heading', { level: 1, name: 'Giriş yap' })).toBeInTheDocument()
  })

  it('oturum kontrol edilirken yükleniyor durumu gösterir', () => {
    renderWithProviders(<AppRoutes />, { route: '/', status: 'loading' })
    expect(screen.getByRole('status')).toHaveTextContent('Oturum kontrol ediliyor')
  })

  it('giriş yapmış kullanıcı giriş sayfasına gidemez, ana sayfaya alınır', () => {
    renderWithProviders(<AppRoutes />, { route: '/giris', user: demoUser('student') })
    expect(screen.getByRole('heading', { level: 1, name: 'Ana Sayfa' })).toBeInTheDocument()
  })

  it('öğrenci yönetim ve personel sayfalarında 403 görür', () => {
    const first = renderWithProviders(<AppRoutes />, { route: '/yonetim', user: demoUser('student') })
    expect(screen.getByRole('heading', { name: 'Bu sayfaya erişim yetkin yok' })).toBeInTheDocument()
    first.unmount()

    renderWithProviders(<AppRoutes />, { route: '/personel', user: demoUser('pendingStaff') })
    expect(screen.getByRole('heading', { name: 'Bu sayfaya erişim yetkin yok' })).toBeInTheDocument()
  })

  it('personel yalnızca personel alanına, admin yalnızca yönetim alanına girer', () => {
    const staff = renderWithProviders(<AppRoutes />, { route: '/personel', user: demoUser('staff') })
    expect(screen.getByRole('heading', { level: 1, name: 'Personel Paneli' })).toBeInTheDocument()
    staff.unmount()

    const staffOnAdmin = renderWithProviders(<AppRoutes />, { route: '/yonetim/kullanicilar', user: demoUser('staff') })
    expect(screen.getByRole('heading', { name: 'Bu sayfaya erişim yetkin yok' })).toBeInTheDocument()
    staffOnAdmin.unmount()

    renderWithProviders(<AppRoutes />, { route: '/yonetim/kullanicilar', user: demoUser('admin') })
    expect(screen.getByRole('heading', { level: 1, name: 'Kullanıcı Yönetimi' })).toBeInTheDocument()
  })

  it('bilinmeyen yolda 404 sayfası gösterir', () => {
    renderWithProviders(<AppRoutes />, { route: '/yok-boyle-bir-sayfa', user: demoUser('student') })
    expect(screen.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument()
  })
})
