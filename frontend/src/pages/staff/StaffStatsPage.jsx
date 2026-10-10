import { Link } from 'react-router-dom'
import { ChartNoAxesCombined, ClipboardList, Clock3, FileText, Megaphone } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Card, EmptyState } from '@/components/ui'
import { StaffNavigation, StaffDemoNotice, StaffMetric } from '@/components/staff/StaffShared'
import { StatusView } from '@/components/stage4/Shared'
import { useResource } from '@/hooks/useResource'
import { staffService } from '@/services'
import { ROUTES } from '@/config/routes'

export function StaffStatsPage() {
  const resource = useResource(staffService.getStaffStats)
  const data = resource.data
  const top = data?.categories?.reduce((max, item) => Math.max(max, item.count), 0) || 1
  return <Page title="Personel İstatistikleri" description="Görev alanınla ilgili örnek soru inceleme ve öneri verileri.">
    <StaffNavigation/><StaffDemoNotice/>
    <StatusView {...resource}>{data && <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StaffMetric title="Görev alanımdaki sorular" value={data.assignedQuestions} icon={ClipboardList}/>
        <StaffMetric title="Yeni" value={data.newQuestions} icon={Clock3}/>
        <StaffMetric title="İnceleniyor" value={data.reviewingQuestions} icon={ChartNoAxesCombined}/>
        <StaffMetric title="Çözüldü" value={data.resolvedQuestions} helper="Personel tarafından incelenmiş"/>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card as="section"><h2 className="mb-1 text-lg font-semibold">Görev kategorileri</h2><p className="mb-5 text-sm text-fg-muted">Personel inceleme alanındaki kayıtlar; tüm üniversitenin genel verisi değildir.</p>
          {data.categories.length ? <ul className="space-y-4">{data.categories.map((item) => <li key={item.name}><div className="mb-1 flex justify-between gap-2 text-sm"><span>{item.name}</span><span className="font-semibold tabular-nums">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{width:`${100*item.count/top}%`}}/></div></li>)}</ul> : <EmptyState title="Kategori verisi yok" description="İncelemeye atanan sorular burada gösterilecek."/>}
        </Card>
        <Card as="section"><h2 className="mb-4 text-lg font-semibold">Belge ve duyuru önerileri</h2>
          <div className="grid gap-3 sm:grid-cols-2"><StaffMetric title="Belge önerilerim" value={data.documentProposals} icon={FileText}/><StaffMetric title="Duyuru önerilerim" value={data.announcementProposals} icon={Megaphone}/></div>
          <p className="mt-4 text-sm text-fg-muted">Yönetici onayını bekleyen öneri sayısı: <strong className="text-fg">{data.proposalPending}</strong></p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-brand"><Link to={ROUTES.staff.documentProposals} className="hover:underline">Belge önerilerim →</Link><Link to={ROUTES.staff.announcementProposals} className="hover:underline">Duyuru önerilerim →</Link></div>
        </Card>
      </div>
      <Card variant="flat"><p className="text-sm text-fg-muted">Bu veriler yalnızca yetkilendirilmiş personel görevlerinin demo özetidir. Gerçek kullanımda Django API, personel yetkilerine göre filtrelenmiş istatistikleri döndürmelidir.</p></Card>
    </div>}</StatusView>
  </Page>
}
