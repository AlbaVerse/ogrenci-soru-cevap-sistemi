import { Users, ShieldCheck, FileText, Megaphone, MessageSquareWarning } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Card, EmptyState } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, AdminMetric } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { adminService, statsService } from '@/services'
import { useResource } from '@/hooks/useResource'
import { StatsCharts, StatOverview } from '@/components/stage4/StatsCharts'

export function AdminReportsPage(){
  const r=useResource(adminService.getReports), general=useResource(statsService.getGeneralStats)
  const d=r.data,top=Math.max(1,...(d?.categories||[]).map(x=>x.count))
  return <Page title="Detaylı Raporlama" description="Genel sistem özetini ve yönetim onay süreçlerini bir arada incele."><AdminNavigation/><AdminDemoNotice/>
    <StatusView {...r}>{d&&<div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><AdminMetric title="Toplam kullanıcı" value={d.totalUsers} icon={Users}/><AdminMetric title="Onay bekleyen personel" value={d.pendingStaff} icon={ShieldCheck}/><AdminMetric title="Görev sorusu" value={d.questions} icon={MessageSquareWarning}/><AdminMetric title="Belge önerisi" value={d.documents} icon={FileText}/><AdminMetric title="Onaylanan belge önerisi" value={d.approvedDocuments}/><AdminMetric title="Onaylanan duyuru önerisi" value={d.approvedAnnouncements} icon={Megaphone}/></div>
      <div className="grid gap-4 lg:grid-cols-2"><Card as="section"><h2 className="mb-3 text-lg font-semibold">Kullanıcı rolleri</h2><div className="space-y-3">{[['Öğrenciler',d.students],['Personel',d.staff],['Bekleyen personel başvurusu',d.pendingStaff]].map(([label,n])=><div key={label} className="flex items-center justify-between border-b border-line pb-2 text-sm"><span>{label}</span><strong>{n}</strong></div>)}</div></Card><Card as="section"><h2 className="mb-3 text-lg font-semibold">İncelenen görev kategorileri</h2>{d.categories?.length?<ul className="space-y-3">{d.categories.map(c=><li key={c.name}><div className="mb-1 flex justify-between text-sm"><span>{c.name}</span><strong>{c.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{width:`${c.count/top*100}%`}}/></div></li>)}</ul>:<EmptyState title="Kategori verisi yok" description="Yeni soru kayıtları kategori analizini oluşturur."/>}</Card></div>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Genel soru analizleri</h2><p className="text-sm text-fg-muted">Aşağıdaki sayılar ayrı bir genel demo veri kümesinden alınır; personel görev verilerinin toplamı değildir.</p><StatusView {...general}>{general.data&&<><StatOverview stats={general.data}/><StatsCharts stats={general.data}/></>}</StatusView></section>
    </div>}</StatusView>
  </Page>
}
