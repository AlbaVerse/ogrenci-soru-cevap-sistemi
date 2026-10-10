import { ArrowLeft, CalendarDays, Megaphone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Badge, Card } from '@/components/ui'
import { DemoNotice, StatusView, dateTr } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { announcementsService } from '@/services'

export function AnnouncementDetailPage() {
  const { id } = useParams()
  const {data,loading,error,retry} = useResource(announcementsService.getAnnouncementById,id)
  return <Page title="Duyuru Ayrıntısı" description="Yayımlanmış duyurunun içeriği.">
    <div className="space-y-4"><Link to={ROUTES.announcements} className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"><ArrowLeft className="size-4"/> Duyurulara dön</Link>
      <StatusView loading={loading} error={error} retry={retry}>{data && <>{data.isDemo && <DemoNotice>Bu duyuru yalnızca tasarım önizlemesidir; resmî duyuru değildir.</DemoNotice>}
        <Card padding="lg" className="space-y-5"><div className="flex items-center gap-3"><span className="rounded-2xl bg-brand-soft p-3 text-on-brand-soft"><Megaphone className="size-6"/></span><div><Badge tone="primary">{data.category||'Genel'}</Badge><h2 className="mt-2 text-xl font-semibold">{data.title}</h2></div></div><p className="flex items-center gap-2 text-sm text-fg-muted"><CalendarDays className="size-4"/>{dateTr(data.publishedAt)}</p><div className="border-t border-line pt-5"><p className="whitespace-pre-wrap text-sm leading-8">{data.content||data.summary||'İçerik bulunmuyor.'}</p></div></Card>
      </>}</StatusView>
    </div>
  </Page>
}
