import {
  BookOpen,
  ChartColumn,
  ChartPie,
  CircleHelp,
  FileText,
  History,
  House,
  Megaphone,
  MessageSquarePlus,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { ROLE } from './roles'
import { ROUTES } from './routes'

/**
 * Role göre kenar çubuğu öğelerini üretir.
 * Not: Menüyü gizlemek güvenlik değildir; gerçek yetkilendirme backend'dedir.
 */
export function getNavigation(user) {
  const items = [
    { id: 'home', label: 'Ana Sayfa', to: ROUTES.home, icon: House, end: true },
    { id: 'chat-new', label: 'Yeni Sohbet', to: ROUTES.chatNew, icon: MessageSquarePlus },
    { id: 'history', label: 'Sohbet Geçmişi', to: ROUTES.history, icon: History },
    {
      id: 'analytics',
      label: 'Analiz ve İstatistik',
      icon: ChartColumn,
      children: [
        { id: 'stats-general', label: 'Genel İstatistikler', to: ROUTES.statsGeneral, icon: ChartPie },
        { id: 'stats-personal', label: 'Kişisel İstatistikler', to: ROUTES.statsPersonal, icon: UserRound },
      ],
    },
    { id: 'faq', label: 'Sık Sorulan Sorular', to: ROUTES.faq, icon: CircleHelp },
    { id: 'guide', label: 'Kullanım Rehberi', to: ROUTES.guide, icon: BookOpen },
    { id: 'announcements', label: 'Duyurular', to: ROUTES.announcements, icon: Megaphone },
    { id: 'documents', label: 'Mevzuat ve Belgeler', to: ROUTES.documents, icon: FileText },
    { id: 'profile', label: 'Profil ve Ayarlar', to: ROUTES.profile, icon: Settings },
  ]

  if (user?.role === ROLE.ADMIN) {
    items.push({ id: 'management', label: 'Yönetim Paneli', to: ROUTES.admin.home, icon: ShieldCheck })
  } else if (user?.role === ROLE.STAFF) {
    items.push({ id: 'management', label: 'Yönetim Paneli', to: ROUTES.staff.home, icon: ShieldCheck })
  }

  return items
}
