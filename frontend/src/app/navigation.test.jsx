import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SidebarNav } from '@/components/layout/SidebarContent'
import { demoUser, renderWithProviders } from '@/test/test-utils'

const MANAGEMENT = { name: 'Yönetim Paneli' }

describe('Role göre kenar çubuğu', () => {
  it('tüm kullanıcılar için belgedeki ortak menü öğelerini gösterir', () => {
    renderWithProviders(<SidebarNav />, { user: demoUser('student') })
    const nav = screen.getByRole('navigation', { name: 'Ana menü' })
    for (const label of [
      'Ana Sayfa', 'Yeni Sohbet', 'Sohbet Geçmişi', 'Genel İstatistikler', 'Kişisel İstatistikler',
      'Sık Sorulan Sorular', 'Kullanım Rehberi', 'Duyurular', 'Mevzuat ve Belgeler', 'Profil ve Ayarlar',
    ]) {
      expect(nav).toHaveTextContent(label)
    }
  })

  it('öğrencide Yönetim Paneli görünmez', () => {
    renderWithProviders(<SidebarNav />, { user: demoUser('student') })
    expect(screen.queryByRole('link', MANAGEMENT)).not.toBeInTheDocument()
  })

  it('onay bekleyen personelde Yönetim Paneli görünmez', () => {
    renderWithProviders(<SidebarNav />, { user: demoUser('pendingStaff') })
    expect(screen.queryByRole('link', MANAGEMENT)).not.toBeInTheDocument()
  })

  it('personelde /personel adresine gider', () => {
    renderWithProviders(<SidebarNav />, { user: demoUser('staff') })
    expect(screen.getByRole('link', MANAGEMENT)).toHaveAttribute('href', '/personel')
  })

  it('adminde /yonetim adresine gider', () => {
    renderWithProviders(<SidebarNav />, { user: demoUser('admin') })
    expect(screen.getByRole('link', MANAGEMENT)).toHaveAttribute('href', '/yonetim')
  })

  it('aktif sayfayı aria-current ile belirtir', () => {
    renderWithProviders(<SidebarNav />, { user: demoUser('student'), route: '/istatistikler/kisisel' })
    expect(screen.getByRole('link', { name: 'Kişisel İstatistikler' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Ana Sayfa' })).not.toHaveAttribute('aria-current')
  })

  it('daraltılmış menüde etiketler erişilebilir adla korunur', () => {
    renderWithProviders(<SidebarNav collapsed />, { user: demoUser('student') })
    expect(screen.getByRole('link', { name: 'Yeni Sohbet' })).toBeInTheDocument()
  })
})
