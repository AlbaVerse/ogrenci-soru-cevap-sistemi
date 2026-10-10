import { Link } from 'react-router-dom'
import { ClipboardCheck, FileClock, Megaphone, MessageSquareWarning, Plus, ChartNoAxesCombined } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Card, Button, EmptyState } from '@/components/ui'
import { StaffNavigation, StaffDemoNotice, StaffMetric, StaffLinkCard, StatusBadge, dateShort } from '@/components/staff/StaffShared'
import { StatusView } from '@/components/stage4/Shared'
import { useResource } from '@/hooks/useResource'
import { staffService } from '@/services'
import { ROUTES } from '@/config/routes'

export function StaffDashboardPage() {
  const resource = useResource(staffService.getDashboard)
  const data = resource.data
  return <Page title="Personel Paneli" description="Görevlerini, belge ve duyuru önerilerini tek yerden takip et." actions={<Link to={ROUTES.home} className="text-sm font-medium text-brand hover:underline">Ana sayfaya dön</Link>}>
    <StaffNavigation/><StaffDemoNotice/>
    <StatusView {...resource}>
      {data && <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <StaffMetric title="İncelenecek sorular" value={data.pendingQuestions} helper="Demo görev alanındaki sorular" icon={MessageSquareWarning}/>
          <StaffMetric title="Belge önerisi bekliyor" value={data.pendingDocumentProposals} icon={FileClock}/>
          <StaffMetric title="Duyuru onayı bekliyor" value={data.pendingAnnouncementProposals} icon={Megaphone}/>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StaffLinkCard to={ROUTES.staff.questions} icon={ClipboardCheck} title="Soruları incele" description="Cevaplanamayan ve yetersiz yanıtları değerlendir."/>
          <StaffLinkCard to={ROUTES.staff.documentProposalNew} icon={Plus} title="Belge önerisi oluştur" description="Yeni PDF veya mevcut belgeye değişiklik öner."/>
          <StaffLinkCard to={ROUTES.staff.announcementProposalNew} icon={Megaphone} title="Duyuru hazırla" description="Taslak kaydet ya da yönetici onayına gönder."/>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card as="section"><h2 className="mb-4 text-lg font-semibold">Öncelikli sorular</h2>
            {data.recentQuestions.length ? <ul className="divide-y divide-line">{data.recentQuestions.map((item) => <li key={item.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-fg-muted">{item.category} · {dateShort(item.createdAt)}</span><StatusBadge status={item.status}/></div><p className="mt-2 text-sm">{item.question}</p></li>)}</ul> : <EmptyState title="Bekleyen soru yok" description="Yeni bildirimler burada görünecek."/>}
            <Link to={ROUTES.staff.questions} className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">Tüm sorular →</Link>
          </Card>
          <Card as="section"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Son önerilerin</h2><ChartNoAxesCombined className="size-4 text-fg-muted"/></div>
            {data.recentProposals.length ? <ul className="divide-y divide-line">{data.recentProposals.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-fg-muted">{dateShort(item.createdAt)}</p></div><StatusBadge status={item.status}/></li>)}</ul> : <EmptyState title="Henüz bir önerin yok" description="Belge veya duyuru önerilerin burada listelenecek."/>}
            <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => resource.retry()}>Yenile</Button><Link to={ROUTES.staff.stats} className="self-center text-sm text-brand hover:underline">İstatistiklere git →</Link></div>
          </Card>
        </div>
      </div>}
    </StatusView>
  </Page>
}
