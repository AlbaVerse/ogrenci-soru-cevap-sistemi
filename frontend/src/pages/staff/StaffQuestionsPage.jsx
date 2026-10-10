import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Select } from '@/components/ui'
import { StaffNavigation, StaffDemoNotice, StatusBadge, dateShort, STAFF_CATEGORIES } from '@/components/staff/StaffShared'
import { StatusView } from '@/components/stage4/Shared'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
import { staffService } from '@/services'

const statuses = [{value:'all',label:'Tüm durumlar'},{value:'new',label:'Yeni'},{value:'reviewing',label:'İnceleniyor'},{value:'resolved',label:'Çözüldü'}]
export function StaffQuestionsPage() {
  const resource = useResource(staffService.listQuestions)
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')
  const filtered = useMemo(() => (resource.data || []).filter((q) =>
    (status === 'all' || q.status === status) &&
    (category === 'all' || q.category === category) &&
    `${q.question} ${q.category}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))
  ), [resource.data, status, category, search])
  async function changeStatus(id, next) {
    if (updating) return
    setUpdating(id); setError('')
    try { await staffService.updateQuestionStatus(id, next); resource.retry(); toast.success('İnceleme durumu güncellendi (demo).') }
    catch (err) { setError(err?.message || 'Güncelleme yapılamadı.'); toast.error('Durum güncellenemedi.') }
    finally { setUpdating(null) }
  }
  return <Page title="Cevaplanamayan Sorular" description="Görev alanındaki yanıtsız veya yetersiz soruları incele ve durumlarını takip et.">
    <StaffNavigation/><StaffDemoNotice/>
    <Card className="mb-5"><div className="grid gap-3 md:grid-cols-3">
      <label className="block text-sm font-medium">Sorularda ara<div className="relative mt-1"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-fg-muted"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Soruda veya kategoride ara" className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 font-normal text-fg outline-none focus:border-primary"/></div></label>
      <Select label="Durum" value={status} onChange={(e) => setStatus(e.target.value)} options={statuses}/>
      <Select label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} options={[{value:'all',label:'Tüm kategoriler'},...STAFF_CATEGORIES.map((value) => ({value,label:value}))]}/>
    </div></Card>
    {error && <p className="mb-4 text-sm text-danger" role="alert">{error}</p>}
    <StatusView {...resource}>{filtered.length ? <div className="space-y-3">{filtered.map((item) => <Card as="article" key={item.id}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.status}/><span className="text-xs text-fg-muted">{item.category}</span></div><span className="text-xs text-fg-muted">{dateShort(item.createdAt)}</span></div>
      <p className="text-sm leading-relaxed">{item.question}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3"><p className="max-w-lg text-xs text-fg-muted">Anonim örnek kayıt · {item.answerStatus === 'insufficient' ? 'Yetersiz cevap' : 'Cevap bulunamadı'}. Durum güncellemesi gerçek bir öğrenciye iletilmez.</p>
        <div className="flex flex-wrap gap-2">{statuses.slice(1).filter((option) => option.value !== item.status).map((option) => <Button key={option.value} size="sm" variant="secondary" loading={updating===item.id} disabled={Boolean(updating)} onClick={() => changeStatus(item.id, option.value)}>{option.label} yap</Button>)}</div>
      </div></Card>)}</div> : <Card><EmptyState title="Eşleşen soru bulunamadı" description="Filtreleri değiştirebilir veya başka kelimeler deneyebilirsin."/></Card>}</StatusView>
  </Page>
}
