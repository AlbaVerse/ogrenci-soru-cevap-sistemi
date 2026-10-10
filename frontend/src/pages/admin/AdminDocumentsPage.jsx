import { useState } from 'react'
import { FilePlus2, Archive } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Input, Select, Textarea, Modal, ConfirmDialog } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, StatusBadge, dateShort, searchMatch } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { adminService } from '@/services'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
const CATEGORY=['Staj İşlemleri','Dersler ve Sınavlar','Öğrenci İşleri','Burslar','Yönetmelikler']
const blank={title:'',category:'',documentDate:'',description:''}
export function AdminDocumentsPage(){
  const r=useResource(adminService.listDocuments),toast=useToast()
  const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[form,setForm]=useState(blank),[file,setFile]=useState(null),[archive,setArchive]=useState(null),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const rows=(r.data||[]).filter(x=>searchMatch([x.title,x.category,x.description],query))
  const change=e=>setForm(old=>({...old,[e.target.name]:e.target.value}))
  async function submit(e){
    e.preventDefault();setError('')
    if(!editing&&(!file||!file.name.toLowerCase().endsWith('.pdf')||(file.type&&file.type!=='application/pdf'))){setError('Yalnızca PDF dosyası seçebilirsin.');return}
    if(file.size>15*1024*1024){setError('PDF dosyası en fazla 15 MB olabilir.');return}
    setBusy(true)
    try{if(editing) await adminService.updateDocument(editing.id,form); else await adminService.createDocument({...form,fileName:file.name,file});setOpen(false);setEditing(null);setFile(null);setForm(blank);r.retry();toast.success('Demo belge bilgileri kaydedildi; gerçek dosya sunucuya yüklenmedi.')}
    catch(err){setError(err?.message||'Belge oluşturulamadı.')}finally{setBusy(false)}
  }
  function openNew(){setEditing(null);setForm(blank);setFile(null);setError('');setOpen(true)}
  function openEdit(item){setEditing(item);setForm({title:item.title,category:item.category,documentDate:item.documentDate||'',description:item.description||''});setFile(null);setError('');setOpen(true)}
  async function doArchive(){try{await adminService.archiveDocument(archive.id);setArchive(null);r.retry();toast.success('Belge demo arşivine alındı.')}catch(err){setError(err?.message||'İşlem başarısız.');setArchive(null)}}
  return <Page title="Belge Yönetimi" description="Demo belge kayıtlarını incele, önerilerden onaylananları takip et." actions={<Button onClick={openNew}><FilePlus2 className="mr-2 size-4"/>Yeni belge</Button>}><AdminNavigation/><AdminDemoNotice/>
    <Card className="mb-5"><Input label="Belgelerde ara" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Başlık veya kategori"/></Card>
    {error&&!open&&<p className="mb-3 text-sm text-danger" role="alert">{error}</p>}
    <StatusView {...r}>{rows.length?<div className="grid gap-3 md:grid-cols-2">{rows.map(x=><Card as="article" key={x.id}><div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{x.title}</h2><StatusBadge status={x.status}/></div><p className="mt-2 text-sm text-fg-muted">{x.description}</p><p className="mt-2 text-xs text-fg-muted">{x.category} · {dateShort(x.documentDate)}</p><p className="mt-2 text-xs text-fg-muted">{x.fileName?`Seçilen dosya: ${x.fileName}`:'PDF bağlantısı yok'} · Gerçek PDF yüklenmedi</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={()=>openEdit(x)}>Düzenle</Button><Button variant="secondary" size="sm" onClick={()=>setArchive(x)}><Archive className="mr-2 size-4"/> Arşivle (demo)</Button></div></Card>)}</div>:<Card><EmptyState title="Henüz yönetilen demo belge yok" description="Onayladığın belge önerileri veya eklediğin örnek belgeler burada görünecek."/></Card>}</StatusView>
    <Modal open={open} onClose={busy?undefined:()=>{setOpen(false);setError('')}} title={editing?"Belge bilgilerini düzenle":"Yeni belge (demo)"} description="PDF dosyasının baytları demo modunda saklanmaz. Mevcut dosya yalnızca Django üzerinden düzenlenebilir.">
      <form id="admin-document-form" onSubmit={submit} className="space-y-3">
        <Input label="Belge başlığı" name="title" value={form.title} onChange={change} maxLength={160} required/>
        <Select label="Kategori" name="category" value={form.category} onChange={change} placeholder="Kategori seç" options={CATEGORY.map(value=>({value,label:value}))} required/>
        <Input label="Belge tarihi" name="documentDate" type="date" value={form.documentDate} onChange={change} required/>
        <Textarea label="Açıklama" name="description" rows={3} value={form.description} onChange={change} maxLength={1200} required/>
        {!editing&&<label className="block text-sm font-medium">PDF seçimi <input type="file" accept=".pdf,application/pdf" required onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm text-fg-muted"/></label>}
        {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-3"><Button type="button" variant="secondary" onClick={()=>setOpen(false)} disabled={busy}>Vazgeç</Button><Button type="submit" loading={busy}>{editing?"Değişiklikleri kaydet":"Demo belge oluştur"}</Button></div>
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(archive)} onCancel={()=>setArchive(null)} onConfirm={doArchive} title="Belgeyi arşivle" description={`${archive?.title||''} kaydı demo listelerinden kaldırılsın mı?`} confirmLabel="Arşivle" tone="danger"/>
  </Page>
}
