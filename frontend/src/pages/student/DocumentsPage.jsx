import { useMemo, useState } from 'react'
import { ArrowRight, FileText, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Badge, Card, EmptyState } from '@/components/ui'
import { DemoNotice, StatusView, dateTr } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { documentsService } from '@/services'

export function DocumentsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const { data, loading, error, retry } = useResource(documentsService.getDocuments)
  const categories = useMemo(()=>[...new Set((data||[]).map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr')), [data])
  const filtered = useMemo(()=> (data||[]).filter(x => (category==='all'||x.category===category) && `${x.title} ${x.description} ${x.category}`.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR'))), [data,category,query])
  return <Page title="Mevzuat ve Belgeler" description="Üniversite kaynaklarını konuya göre incele, aradığın belgeyi bul.">
    <div className="space-y-5"><StatusView loading={loading} error={error} retry={retry}>{data && <>{data.some(x=>x.status==='demo') && <DemoNotice>Listelenen örnek belge başlıkları resmî PDF kayıtları değildir. Gerçek dosya bağlantısı olmayan belgeler açılamaz.</DemoNotice>}
      <Card padding="md"><div className="grid gap-3 md:grid-cols-[1fr_230px]"><div><label htmlFor="document-search" className="mb-1.5 block text-xs font-medium text-fg-muted">Belge ara</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-fg-muted"/><input id="document-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Başlık, kategori veya açıklama..." className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-primary"/></div></div><div><label htmlFor="document-category" className="mb-1.5 block text-xs font-medium text-fg-muted">Kategori</label><select id="document-category" value={category} onChange={e=>setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-fg"><option value="all">Tüm kategoriler</option>{categories.map(c=><option value={c} key={c}>{c}</option>)}</select></div></div><p className="mt-3 text-xs text-fg-muted">{filtered.length} belge listeleniyor</p></Card>
      {filtered.length ? <div className="grid gap-4 md:grid-cols-2">{filtered.map(d=><Card key={d.id} as="article" className="flex h-full flex-col gap-3"><div className="flex items-start justify-between gap-2"><span className="rounded-xl bg-brand-soft p-2.5 text-on-brand-soft"><FileText className="size-5" aria-hidden="true"/></span><Badge tone={d.status==='demo'?'warning':'neutral'}>{d.status==='demo'?'Örnek kayıt':d.category||'Belge'}</Badge></div><div><h2 className="text-base font-semibold">{d.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">{d.description || 'Açıklama bulunmuyor.'}</p></div><div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3"><span className="text-xs text-fg-muted">{dateTr(d.documentDate)}</span><Link to={ROUTES.documents+'/'+encodeURIComponent(d.id)} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">Ayrıntılar <ArrowRight className="size-4"/></Link></div></Card>)}</div> : <Card><EmptyState icon={FileText} title="Belge bulunamadı" description="Başka bir arama veya kategori deneyebilirsin."/></Card>}
    </>}</StatusView></div>
  </Page>
}
