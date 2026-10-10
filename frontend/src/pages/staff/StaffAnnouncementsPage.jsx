import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Megaphone, Pencil } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Alert, Button, Card, EmptyState, Input, Select, Textarea } from '@/components/ui'
import { StaffNavigation, StaffDemoNotice, StatusBadge, dateShort } from '@/components/staff/StaffShared'
import { StatusView } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
import { staffService } from '@/services'

const categories = ['Öğrenci İşleri', 'Eğitim', 'Staj', 'Genel', 'Etkinlik']
export function StaffAnnouncementsPage() {
  const resource = useResource(staffService.listAnnouncementProposals)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const items = (resource.data || []).filter((a) => (filter === 'all' || a.status === filter) && `${a.title} ${a.content}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')))
  return <Page title="Duyuru Önerileri" description="Duyuru taslakları oluştur, yönetici onayını bekleyen önerilerini takip et." actions={<Link to={ROUTES.staff.announcementProposalNew} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"><Megaphone className="size-4"/> Duyuru hazırla</Link>}>
    <StaffNavigation/><StaffDemoNotice/>
    <Card className="mb-5"><div className="grid gap-3 sm:grid-cols-2"><Input label="Duyurularımda ara" placeholder="Başlık veya içerik" value={search} onChange={(e) => setSearch(e.target.value)}/><Select label="Durum" value={filter} onChange={(e) => setFilter(e.target.value)} options={[{value:'all',label:'Tümü'},{value:'draft',label:'Taslak'},{value:'pending',label:'Onay bekliyor'},{value:'approved',label:'Onaylandı'},{value:'rejected',label:'Reddedildi'}]}/></div></Card>
    <StatusView {...resource}>{items.length ? <div className="space-y-3">{items.map((item) => <Card as="article" key={item.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-xs text-fg-muted">{item.category} · {dateShort(item.createdAt)}</p></div><StatusBadge status={item.status}/></div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{item.content}</p>
      {item.status==='rejected' && <Alert className="mt-3" tone="warning" title="Red gerekçesi">{item.rejectionReason || 'Bir gerekçe belirtilmedi.'}</Alert>}
      {item.status==='draft' && <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline" to={`${ROUTES.staff.announcementProposalNew}?edit=${encodeURIComponent(item.id)}`}><Pencil className="size-4"/> Taslağı düzenle</Link>}
    </Card>)}</div> : <Card><EmptyState title="Duyuru önerisi bulunamadı" description={search || filter !== 'all' ? 'Başka filtre dene.' : 'Duyuru taslağı hazırlayarak başlayabilirsin.'}/></Card>}</StatusView>
  </Page>
}

export function StaffAnnouncementProposalNewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const editingId = params.get('edit')
  const resource = useResource(staffService.listAnnouncementProposals)
  const existing = editingId ? resource.data?.find((item) => item.id === editingId) : null
  const [draft, setDraft] = useState({ title: '', category: '', content: '' })
  const [loadedId, setLoadedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Taslağı yalnızca ilk yüklendiğinde form alanlarına aktar.
  useEffect(() => {
    if (existing && loadedId !== editingId) {
      setDraft({ title: existing.title, category: existing.category, content: existing.content })
      setLoadedId(editingId)
    }
  }, [existing, editingId, loadedId])
  const set = (name) => (event) => setDraft((old) => ({ ...old, [name]: event.target.value }))
  async function save(status) {
    if (busy) return
    if (!draft.title.trim() || !draft.category || !draft.content.trim()) { setError('Başlık, kategori ve içerik zorunludur.'); return }
    setBusy(true); setError('')
    try {
      if (editingId) await staffService.updateAnnouncementProposal(editingId, { ...draft, status })
      else await staffService.createAnnouncementProposal({ ...draft, status })
      toast.success(status === 'draft' ? 'Duyuru taslağı demo olarak kaydedildi.' : 'Duyuru önerisi demo olarak kaydedildi; admin onayı simüle ediliyor.')
      navigate(ROUTES.staff.announcementProposals)
    } catch (err) { setError(err?.message || 'Duyuru kaydedilemedi.') }
    finally { setBusy(false) }
  }
  return <Page title={editingId ? 'Duyuru Taslağını Düzenle' : 'Yeni Duyuru Önerisi'} description="Taslak hazırlayabilir veya yönetici onayına gönderebilirsin." actions={<Link to={ROUTES.staff.announcementProposals} className="text-sm text-brand hover:underline">← Duyurularıma dön</Link>}>
    <StaffNavigation/><StaffDemoNotice/>
    {editingId && resource.loading ? <StatusView {...resource}><div/></StatusView> : editingId && (!existing || existing.status !== 'draft') ? <Card><Alert tone="warning" title="Taslak bulunamadı">Bu duyuruya erişilemiyor veya artık taslak durumunda değil.</Alert></Card> :
    <Card className="max-w-3xl"><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save('pending') }}>
      <Input label="Duyuru başlığı" required maxLength={160} placeholder="Örn. Bilgilendirme duyurusu" value={draft.title} onChange={set('title')}/>
      <Select label="Kategori" required placeholder="Kategori seç" value={draft.category} onChange={set('category')} options={categories.map((category) => ({value:category,label:category}))}/>
      <Textarea label="Duyuru içeriği" required rows={9} maxLength={5000} placeholder="Duyuru metnini buraya yaz..." value={draft.content} onChange={set('content')}/>
      <div className="rounded-xl border border-line bg-surface-2 p-4"><h2 className="text-sm font-semibold">Önizleme</h2><p className="mt-2 font-medium">{draft.title || 'Duyuru başlığı'}</p><p className="mt-1 text-xs text-fg-muted">{draft.category || 'Kategori seçilmedi'}</p><p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">{draft.content || 'Duyuru içeriği burada görünecek.'}</p></div>
      {error && <Alert tone="danger" title="Kaydetme başarısız">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" type="button" onClick={() => navigate(ROUTES.staff.announcementProposals)} disabled={busy}>Vazgeç</Button><Button variant="secondary" type="button" onClick={() => save('draft')} disabled={busy}>Taslak kaydet</Button><Button loading={busy} type="submit">Onaya gönder (demo)</Button></div>
    </form></Card>}
  </Page>
}
