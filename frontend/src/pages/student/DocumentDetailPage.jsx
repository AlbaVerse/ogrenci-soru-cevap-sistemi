import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Badge, Card } from '@/components/ui'
import { DemoNotice, InfoPanel, StatusView, dateTr, safeFileUrl } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { documentsService } from '@/services'

export function DocumentDetailPage() {
  const { id } = useParams()
  const { data: doc, loading, error, retry } = useResource(documentsService.getDocumentById, id)
  const url = safeFileUrl(doc?.fileUrl)
  return <Page title="Belge Ayrıntısı" description="Belge bilgilerini ve varsa doğrulanabilir PDF bağlantısını incele.">
    <div className="space-y-4"><Link to={ROUTES.documents} className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"><ArrowLeft className="size-4"/> Tüm belgelere dön</Link>
    <StatusView loading={loading} error={error} retry={retry}>{doc && <>{doc.status==='demo' && <DemoNotice>Bu yalnızca belge arayüzü örneğidir; gerçek üniversite yönergesi veya PDF değildir.</DemoNotice>}
      <Card className="space-y-5"><div className="flex flex-wrap items-center gap-3"><span className="rounded-xl bg-brand-soft p-3 text-on-brand-soft"><FileText className="size-6"/></span><div className="min-w-0"><h2 className="text-xl font-semibold">{doc.title}</h2><p className="text-sm text-fg-muted">{doc.category || 'Kategori belirtilmemiş'} · {dateTr(doc.documentDate)}</p></div></div><div className="border-t border-line pt-4"><h3 className="mb-2 text-sm font-semibold">Belge açıklaması</h3><p className="whitespace-pre-wrap text-sm leading-7 text-fg-muted">{doc.description || 'Bu belge için açıklama bulunmuyor.'}</p></div><div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90"><ExternalLink className="size-4"/> PDF'yi aç</a> : <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-fg-muted" aria-disabled="true"><FileText className="size-4"/> PDF bağlantısı mevcut değil</span>}<Badge tone="neutral">{doc.status==='demo'?'Örnek kayıt':doc.status||'Belge'}</Badge></div></Card>
      {!url && <InfoPanel>PDF dosyası Django üzerinden sağlanmadığı için görüntüleme seçeneği kapalıdır. Dosya bağlantısı uydurulmaz.</InfoPanel>}
    </>}</StatusView></div>
  </Page>
}
