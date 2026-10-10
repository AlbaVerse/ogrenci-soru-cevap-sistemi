import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Input, Select, Textarea, Modal } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, StatusBadge, dateShort, searchMatch } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { adminService } from '@/services'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
const blank={title:'',category:'Genel',content:''}
export function AdminAnnouncementsPage(){
  const r=useResource(adminService.listAnnouncements),toast=useToast()
  const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[editing,setEditing]=useState(null),[form,setForm]=useState(blank),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const rows=(r.data||[]).filter(x=>searchMatch([x.title,x.category,x.content],query))
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{if(editing)await adminService.updateAnnouncement(editing.id,form);else await adminService.createAnnouncement(form);r.retry();setOpen(false);setEditing(null);setForm(blank);toast.success('Demo duyuru bilgileri kaydedildi; gerçek sunucuya gönderilmedi.')}catch(err){setError(err?.message||'Duyuru oluşturulamadı.')}finally{setBusy(false)}}
  function openNew(){setEditing(null);setForm(blank);setError('');setOpen(true)}
  function openEdit(a){setEditing(a);setForm({title:a.title,category:a.category,content:a.content});setError('');setOpen(true)}
  return <Page title="Duyuru Yönetimi" description="Yayımlanmış demo duyurularını görüntüle ve örnek duyuru ekle." actions={<Button onClick={openNew}><Megaphone className="mr-2 size-4"/>Duyuru oluştur</Button>}><AdminNavigation/><AdminDemoNotice/>
    <Card className="mb-5"><Input label="Duyuru ara" placeholder="Başlık veya kategori" value={query} onChange={e=>setQuery(e.target.value)}/></Card>
    <StatusView {...r}>{rows.length?<div className="space-y-3">{rows.map(a=><Card as="article" key={a.id}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{a.title}</h2><StatusBadge status={a.status}/></div><p className="mt-1 text-xs text-fg-muted">{a.category} · {dateShort(a.publishedAt)}</p><p className="mt-3 whitespace-pre-wrap text-sm text-fg-muted">{a.content}</p><Button variant="secondary" size="sm" className="mt-4" onClick={()=>openEdit(a)}>Düzenle</Button></Card>)}</div>:<Card><EmptyState title="Yönetilen demo duyuru yok" description="Onaylanan personel önerileri veya yeni duyurular burada listelenir."/></Card>}</StatusView>
    <Modal open={open} onClose={busy?undefined:()=>setOpen(false)} title={editing?"Duyuruyu düzenle":"Duyuru yayımla (demo)"} description="Oluşturulan duyuru yalnızca tarayıcıdaki demo verilerine eklenir.">
      <form onSubmit={submit} className="space-y-3"><Input required maxLength={160} label="Başlık" value={form.title} onChange={e=>setForm(old=>({...old,title:e.target.value}))}/><Select label="Kategori" value={form.category} onChange={e=>setForm(old=>({...old,category:e.target.value}))} options={['Genel','Staj İşlemleri','Dersler ve Sınavlar','Öğrenci İşleri','Burslar','Yönetmelikler'].map(value=>({value,label:value}))}/><Textarea required label="Duyuru içeriği" maxLength={5000} rows={5} value={form.content} onChange={e=>setForm(old=>({...old,content:e.target.value}))}/>{error&&<p role="alert" className="text-sm text-danger">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Vazgeç</Button><Button type="submit" loading={busy}>{editing?"Kaydet (demo)":"Yayımla (demo)"}</Button></div></form>
    </Modal>
  </Page>
}
