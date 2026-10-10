import { useMemo, useState } from 'react'
import { ArrowRight, Megaphone, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Badge, Card, EmptyState } from '@/components/ui'
import { DemoNotice, StatusView, dateTr } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { announcementsService } from '@/services'

export function AnnouncementsPage() {
  const [query,setQuery] = useState('')
  const [category,setCategory] = useState('all')
  const {data,loading,error,retry} = useResource(announcementsService.getPublishedAnnouncements)
  const categories = useMemo(()=>[...new Set((data||[]).map(x=>x.category).filter(Boolean))],[data])
  const filtered = useMemo(()=>(data||[]).filter(a=> (category==='all'||a.category===category) && `${a.title} ${a.summary} ${a.content}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)),[data,category,query])
  return <Page title="Duyurular" description="Yayımlanmış bilgilendirmeler ve duyuru ayrıntıları.">
    <div className="space-y-5"><StatusView loading={loading} error={error} retry={retry}>{data && <>{data.some(x=>x.isDemo) && <DemoNotice>Bu duyurular örnektir; resmî üniversite duyuruları değildir.</DemoNotice>}
      <Card><div className="grid gap-3 md:grid-cols-[1fr_220px]"><div><label htmlFor="ann-search" className="mb-1.5 block text-xs font-medium text-fg-muted">Duyuru ara</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-fg-muted"/><input id="ann-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Duyurularda ara..." className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-primary"/></div></div><div><label htmlFor="ann-category" className="mb-1.5 block text-xs font-medium text-fg-muted">Kategori</label><select id="ann-category" value={category} onChange={e=>setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm text-fg"><option value="all">Tüm duyurular</option>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></div></div></Card>
      {filtered.length ? <div className="space-y-3">{filtered.map(a=><Card as="article" key={a.id} className="flex flex-wrap items-start gap-4 sm:flex-nowrap"><span className="rounded-xl bg-brand-soft p-3 text-on-brand-soft"><Megaphone className="size-5" aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone="neutral">{a.category||'Genel'}</Badge>{a.isDemo && <Badge tone="warning">Demo</Badge>}<span className="text-xs text-fg-muted">{dateTr(a.publishedAt)}</span></div><h2 className="text-base font-semibold">{a.title}</h2><p className="mt-2 text-sm leading-6 text-fg-muted">{a.summary||a.content}</p><Link to={ROUTES.announcements+'/'+encodeURIComponent(a.id)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">Duyuruyu oku <ArrowRight className="size-4"/></Link></div></Card>)}</div> : <Card><EmptyState icon={Megaphone} title="Duyuru bulunamadı" description="Filtreleri değiştirerek yeniden deneyebilirsin."/></Card>}
    </>}</StatusView></div>
  </Page>
}
