import { useMemo, useState } from 'react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Input, Select } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, StatusBadge, dateShort, searchMatch } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { adminService } from '@/services'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
const statuses=[{value:'all',label:'Tümü'},{value:'new',label:'Yeni'},{value:'reviewing',label:'İnceleniyor'},{value:'resolved',label:'Çözüldü'}]
export function AdminFeedbackPage(){
  const r=useResource(adminService.listFeedback),toast=useToast()
  const [query,setQuery]=useState(''),[status,setStatus]=useState('all'),[busy,setBusy]=useState(null),[error,setError]=useState('')
  const filtered=useMemo(()=>(r.data||[]).filter(x=>(status==='all'||x.status===status)&&searchMatch([x.question,x.category],query)),[r.data,status,query])
  async function update(id,next){setBusy(id);setError('');try{await adminService.updateFeedback(id,next);r.retry();toast.success('Geri bildirim durumu güncellendi (demo).')}catch(err){setError(err?.message||'Durum güncellenemedi.')}finally{setBusy(null)}}
  return <Page title="Soru ve Geri Bildirim Yönetimi" description="Yanıtsız ve yetersiz cevapları anonim olarak incele; durumlarını yönet."><AdminNavigation/><AdminDemoNotice/>
    <Card className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]"><Input label="Sorularda ara" placeholder="Kategori veya soru metni" value={query} onChange={e=>setQuery(e.target.value)}/><Select label="Durum" options={statuses} value={status} onChange={e=>setStatus(e.target.value)}/></Card>
    {error&&<p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
    <StatusView {...r}>{filtered.length?<div className="space-y-3">{filtered.map(q=><Card as="article" key={q.id}><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge status={q.status}/><span className="text-xs text-fg-muted">{q.category} · {dateShort(q.createdAt)}</span></div><p className="mt-3 text-sm leading-relaxed">{q.question}</p><p className="mt-1 text-xs text-fg-muted">{q.answerStatus==='insufficient'?'Yetersiz yanıt':'Yanıt bulunamadı'} · Demo anonim örnek soru</p><div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">{statuses.slice(1).filter(s=>s.value!==q.status).map(s=><Button key={s.value} size="sm" variant="secondary" disabled={Boolean(busy)} loading={busy===q.id} onClick={()=>update(q.id,s.value)}>{s.label} yap</Button>)}</div></Card>)}</div>:<Card><EmptyState title="Eşleşen soru yok" description="Filtreyi değiştirerek tekrar deneyebilirsin."/></Card>}</StatusView>
  </Page>
}
