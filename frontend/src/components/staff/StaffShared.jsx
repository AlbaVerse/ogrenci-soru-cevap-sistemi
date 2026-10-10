import { NavLink } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { DemoNotice } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'

export const staffTabs = [
  { label: 'Özet', to: ROUTES.staff.home, end: true },
  { label: 'Sorular', to: ROUTES.staff.questions },
  { label: 'Belgeler', to: ROUTES.staff.documentProposals },
  { label: 'Duyurular', to: ROUTES.staff.announcementProposals },
  { label: 'İstatistikler', to: ROUTES.staff.stats },
]

export function StaffNavigation() {
  return <nav aria-label="Personel paneli sekmeleri" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
    {staffTabs.map(({ label, to, end }) => <NavLink key={to} to={to} end={end}
      className={({ isActive }) => `whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'border-primary bg-brand-soft text-on-brand-soft' : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg'}`}>{label}</NavLink>)}
  </nav>
}

export function StaffDemoNotice() {
  return <div className="mb-5"><DemoNotice>Personel ekranları demo modunda çalışır. Kayıtlar ve onay durumları gerçek üniversite sistemine gönderilmez. Resmî belge ya da gerçek öğrenci sorusu içermez.</DemoNotice></div>
}
export const statusMap = {
  new: { label: 'Yeni', tone: 'info' },
  reviewing: { label: 'İnceleniyor', tone: 'warning' },
  resolved: { label: 'Çözüldü', tone: 'success' },
  draft: { label: 'Taslak', tone: 'neutral' },
  pending: { label: 'Onay bekliyor', tone: 'warning' },
  approved: { label: 'Onaylandı', tone: 'success' },
  rejected: { label: 'Reddedildi', tone: 'danger' },
}
export function StatusBadge({ status }) {
  const { label, tone } = statusMap[status] || { label: 'Bilinmiyor', tone: 'neutral' }
  return <Badge tone={tone}>{label}</Badge>
}
export function StaffMetric({ title, value, helper, icon: Icon }) {
  return <Card className="min-w-0">
    <div className="flex items-center justify-between gap-2"><p className="text-sm text-fg-muted">{title}</p>{Icon && <Icon className="size-5 text-brand" aria-hidden="true"/>}</div>
    <p className="mt-3 text-3xl font-semibold tabular-nums">{value ?? 0}</p>
    {helper && <p className="mt-1 text-xs text-fg-muted">{helper}</p>}
  </Card>
}
export function StaffLinkCard({ to, icon: Icon, title, description, action = 'Görüntüle' }) {
  return <Card as={NavLink} to={to} interactive className="group flex h-full flex-col gap-2">
    <div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-on-brand-soft"><Icon className="size-5" aria-hidden="true"/></span><ArrowUpRight className="size-4 text-fg-muted group-hover:text-brand" aria-hidden="true"/></div>
    <h3 className="mt-2 font-semibold">{title}</h3><p className="text-sm text-fg-muted">{description}</p><span className="mt-auto pt-2 text-xs font-semibold text-brand">{action} →</span>
  </Card>
}
export const STAFF_CATEGORIES = ['Staj İşlemleri', 'Dersler ve Sınavlar', 'Öğrenci İşleri', 'Burslar', 'Yönetmelikler']
export const dateShort = (value) => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(value)) : '—'
export function FieldError({ children }) { return children ? <p role="alert" className="mt-1 text-sm text-danger">{children}</p> : null }
