import { useMemo, useState } from 'react'
import { CircleHelp, Search } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Accordion, Card, EmptyState } from '@/components/ui'
import { DemoNotice, StatusView } from '@/components/stage4/Shared'
import { useResource } from '@/hooks/useResource'
import { faqService } from '@/services'
import { IS_MOCK } from '@/config/env'

export function FaqPage() {
  const [term,setTerm] = useState('')
  const [category,setCategory] = useState('all')
  const {data,loading,error,retry} = useResource(faqService.getFaqs)
  const categories = useMemo(()=>[...new Set((data||[]).map(x=>x.category).filter(Boolean))], [data])
  const filtered = useMemo(()=>(data||[]).filter(x=>(category==='all'||x.category===category) && `${x.title} ${x.content}`.toLocaleLowerCase('tr-TR').includes(term.trim().toLocaleLowerCase('tr-TR'))), [data,category,term])
  return <Page title="Sık Sorulan Sorular" description="AlbaVerse kullanımı ve üniversite süreçleri hakkında genel sorular.">
    <div className="space-y-5">{IS_MOCK && <DemoNotice>Bu cevaplar kullanım örnekleridir; üniversitenin resmî akademik kararlarını temsil etmez.</DemoNotice>}
      <Card><label htmlFor="faq-search" className="mb-2 block text-sm font-medium">Sorularda ara</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-fg-muted"/><input id="faq-search" value={term} onChange={e=>setTerm(e.target.value)} type="search" placeholder="Örneğin: Sohbet geçmişi" className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-primary"/></div><div className="mt-4 flex flex-wrap gap-2" aria-label="Soru kategorileri"><button type="button" aria-pressed={category==='all'} onClick={()=>setCategory('all')} className={`rounded-full px-3 py-1.5 text-xs font-medium ${category==='all'?'bg-brand-soft text-on-brand-soft':'bg-surface-2 text-fg-muted'}`}>Tümü</button>{categories.map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${category===c?'bg-brand-soft text-on-brand-soft':'bg-surface-2 text-fg-muted'}`}>{c}</button>)}</div></Card>
      <StatusView loading={loading} error={error} retry={retry}>{filtered.length ? <Accordion key={`${category}:${term}`} items={filtered.map(x=>({ id:x.id,title:x.title,content:x.content }))}/> : <Card><EmptyState icon={CircleHelp} title="Uygun soru bulunamadı" description="Başka anahtar kelime veya kategori deneyebilirsin."/></Card>}</StatusView>
    </div>
  </Page>
}
