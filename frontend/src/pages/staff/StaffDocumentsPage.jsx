import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FilePlus2, Search } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Input, Select, Textarea, Alert } from '@/components/ui'
import { StaffNavigation, StaffDemoNotice, StatusBadge, STAFF_CATEGORIES, dateShort } from '@/components/staff/StaffShared'
import { StatusView } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
import { staffService, documentsService } from '@/services'

export function StaffDocumentsPage() {
  const resource = useResource(staffService.listDocumentProposals)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const rows = (resource.data || []).filter((item) =>
    (filter === 'all' || item.status === filter) &&
    `${item.title} ${item.category}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))
  )
  return <Page title="Belge Önerileri" description="Mevzuat için hazırladığın önerilerin admin onay durumunu takip et." actions={<Link to={ROUTES.staff.documentProposalNew} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"><FilePlus2 className="size-4"/> Yeni öneri</Link>}>
    <StaffNavigation/><StaffDemoNotice/>
    <Card className="mb-5"><div className="grid gap-3 sm:grid-cols-2">
      <Input label="Önerilerimde ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Belge başlığı veya kategori"/>
      <Select label="Onay durumu" value={filter} onChange={(e) => setFilter(e.target.value)} options={[{value:'all',label:'Tümü'},{value:'pending',label:'Onay bekliyor'},{value:'approved',label:'Onaylandı'},{value:'rejected',label:'Reddedildi'}]}/>
    </div></Card>
    <StatusView {...resource}>{rows.length ? <div className="space-y-3">{rows.map((item) => <Card key={item.id} as="article">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-xs text-fg-muted">{item.category} · {dateShort(item.createdAt)} · {item.proposalType === 'update' ? 'Değişiklik önerisi' : 'Yeni belge'}</p></div><StatusBadge status={item.status}/></div>
      <p className="mt-3 text-sm text-fg-muted">{item.description}</p><p className="mt-2 text-xs text-fg-muted">{item.fileName ? `PDF seçimi: ${item.fileName}` : 'Yeni PDF dosyası eklenmedi'} · Demo modunda dosya baytları saklanmaz.</p>
      {item.status === 'rejected' && <Alert tone="warning" className="mt-3" title="Red gerekçesi">{item.rejectionReason || 'Bir gerekçe belirtilmedi.'}</Alert>}
    </Card>)}</div> : <Card><EmptyState title="Belge önerisi bulunamadı" description={search || filter!=='all' ? 'Filtreleri değiştirerek tekrar ara.' : 'İlk belge önerini oluşturarak başlayabilirsin.'} action={!search && filter==='all' ? <Link to={ROUTES.staff.documentProposalNew} className="text-sm font-semibold text-brand hover:underline">Yeni belge önerisi oluştur →</Link> : null}/></Card>}</StatusView>
  </Page>
}

export function StaffDocumentProposalNewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const docs = useResource(documentsService.getDocuments)
  const [form, setForm] = useState({ proposalType: 'new', documentId: '', title: '', category: '', documentDate: '', description: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (field) => (e) => setForm((prev) => ({...prev, [field]: e.target.value}))
  function chooseFile(event) {
    const next = event.target.files?.[0] || null
    setError('')
    if (!next) { setFile(null); return }
    if (!next.name.toLowerCase().endsWith('.pdf') || (next.type && next.type !== 'application/pdf')) {
      setFile(null); event.target.value = ''; setError('Yalnızca PDF dosyası seçebilirsin.'); return
    }
    if (next.size > 10*1024*1024) { setFile(null); event.target.value = ''; setError('PDF en fazla 10 MB olabilir.'); return }
    setFile(next)
  }
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if (form.proposalType === 'new' && !file) { setError('Yeni belge önerisinde bir PDF seçmelisin.'); return }
    setBusy(true); setError('')
    try {
      await staffService.createDocumentProposal({ ...form, file, fileName: file?.name || null, fileSize: file?.size || null })
      toast.success('Belge önerisi demo olarak kaydedildi; yöneticiye gönderilmedi.')
      navigate(ROUTES.staff.documentProposals)
    } catch (err) { setError(err?.message || 'Belge önerisi kaydedilemedi.') }
    finally { setBusy(false) }
  }
  return <Page title="Yeni Belge Önerisi" description="Mevzuat için belge ekleme veya güncelleme talebi hazırla." actions={<Link to={ROUTES.staff.documentProposals} className="text-sm text-brand hover:underline">← Önerilerime dön</Link>}>
    <StaffNavigation/><StaffDemoNotice/>
    <Card className="max-w-3xl"><form onSubmit={submit} className="space-y-5">
      <Select label="Öneri türü" value={form.proposalType} onChange={(e) => setForm((old) => ({...old, proposalType: e.target.value, documentId: ''}))} options={[{value:'new',label:'Yeni PDF belgesi'},{value:'update',label:'Mevcut belgeye değişiklik önerisi'}]}/>
      {form.proposalType === 'update' && <StatusView {...docs}>{docs.data && <Select label="Güncellenecek belge" required value={form.documentId} onChange={set('documentId')} placeholder="Belge seç" options={docs.data.map((doc) => ({value: doc.id,label: doc.title}))}/>}</StatusView>}
      <Input label="Belge başlığı" required maxLength={160} value={form.title} onChange={set('title')} placeholder="Örn. Staj yönergesi güncellemesi"/>
      <div className="grid gap-4 sm:grid-cols-2"><Select label="Kategori" required value={form.category} onChange={set('category')} placeholder="Kategori seç" options={STAFF_CATEGORIES.map((category) => ({value:category,label:category}))}/><Input label="Belge tarihi" required type="date" value={form.documentDate} onChange={set('documentDate')}/></div>
      <Textarea label="Açıklama ve öneri gerekçesi" required maxLength={1200} rows={5} value={form.description} onChange={set('description')} placeholder="Bu belge neden eklenmeli veya değiştirilmelidir?"/>
      <div><label htmlFor="staff-pdf" className="block text-sm font-medium">PDF dosyası {form.proposalType === 'new' ? '(zorunlu)' : '(isteğe bağlı)'}</label><input id="staff-pdf" type="file" accept=".pdf,application/pdf" onChange={chooseFile} className="mt-2 block w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-medium file:text-on-brand-soft"/>
      <p className="mt-1 text-xs text-fg-muted">En fazla 10 MB. Demo modunda PDF içeriği saklanmaz veya sunucuya yüklenmez; yalnızca seçilen dosyanın adı kaydedilir.</p>{file && <p className="mt-1 text-sm text-success">Seçilen dosya: {file.name}</p>}</div>
      {error && <Alert tone="danger" title="Öneri kaydedilemedi">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" type="button" onClick={() => navigate(ROUTES.staff.documentProposals)} disabled={busy}>Vazgeç</Button><Button type="submit" loading={busy}>Onaya gönder (demo)</Button></div>
    </form></Card>
  </Page>
}
