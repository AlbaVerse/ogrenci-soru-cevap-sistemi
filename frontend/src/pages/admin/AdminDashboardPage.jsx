import { Link } from 'react-router-dom'
import { Users, UserRoundCheck, Files, Megaphone, MessageCircleWarning, ChartColumn } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Card, EmptyState } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, AdminMetric, StatusBadge, dateShort } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { adminService } from '@/services'
import { useResource } from '@/hooks/useResource'

const shortcuts=[
  {to:ROUTES.admin.staffRequests,label:'Personel başvuruları',icon:UserRoundCheck},
  {to:ROUTES.admin.documentProposals,label:'Belge önerileri',icon:Files},
  {to:ROUTES.admin.announcementProposals,label:'Duyuru önerileri',icon:Megaphone},
  {to:ROUTES.admin.feedback,label:'Geri bildirimler',icon:MessageCircleWarning},
]
export function AdminDashboardPage(){
  const resource=useResource(adminService.getDashboard),d=resource.data
  return <Page title="Yönetim Paneli" description="AlbaVerse sistem durumunu ve inceleme bekleyen işlemleri takip et.">
    <AdminNavigation/><AdminDemoNotice/>
    <StatusView {...resource}>{d&&<div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminMetric title="Kullanıcılar" value={d.users} icon={Users}/>
        <AdminMetric title="Personel başvuruları" value={d.pendingStaff} icon={UserRoundCheck}/>
        <AdminMetric title="Bekleyen belge önerileri" value={d.pendingDocuments} icon={Files}/>
        <AdminMetric title="Bekleyen duyuru önerileri" value={d.pendingAnnouncements} icon={Megaphone}/>
        <AdminMetric title="İncelenecek geri bildirimler" value={d.pendingFeedback} icon={MessageCircleWarning}/>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{shortcuts.map(({to,label,icon:Icon})=><Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-sm font-medium hover:border-line-strong hover:bg-surface-2"><Icon className="size-5 text-brand"/>{label} →</Link>)}</div>
      <div className="grid gap-4 lg:grid-cols-2">{[{title:'Son belge önerileri',rows:d.recentDocuments,to:ROUTES.admin.documentProposals},{title:'Son duyuru önerileri',rows:d.recentAnnouncements,to:ROUTES.admin.announcementProposals}].map(g=><Card key={g.title} as="section"><h2 className="mb-3 text-lg font-semibold">{g.title}</h2>{g.rows.length?<ul className="divide-y divide-line">{g.rows.map(x=><li key={x.id} className="flex items-start justify-between gap-3 py-3"><div><p className="text-sm font-medium">{x.title}</p><p className="text-xs text-fg-muted">{dateShort(x.createdAt)}</p></div><StatusBadge status={x.status}/></li>)}</ul>:<EmptyState title="Henüz öneri yok" description="Yeni öneriler burada görüntülenecek."/>}<Link className="mt-3 inline-block text-sm font-medium text-brand hover:underline" to={g.to}>Tümünü görüntüle →</Link></Card>)}</div>
      <Link to={ROUTES.admin.reports} className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"><ChartColumn className="size-4"/> Detaylı raporlara git →</Link>
    </div>}</StatusView>
  </Page>
}
