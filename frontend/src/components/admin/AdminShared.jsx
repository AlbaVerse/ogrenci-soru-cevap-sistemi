import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Badge, Button, Card, Modal, Textarea } from '@/components/ui'
import { DemoNotice } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'

export const ADMIN_TABS = [
  {label:'Özet',to:ROUTES.admin.home,end:true},
  {label:'Kullanıcılar',to:ROUTES.admin.users},
  {label:'Personel Onayları',to:ROUTES.admin.staffRequests},
  {label:'Belgeler',to:ROUTES.admin.documents},
  {label:'Belge Önerileri',to:ROUTES.admin.documentProposals},
  {label:'Duyurular',to:ROUTES.admin.announcements},
  {label:'Duyuru Önerileri',to:ROUTES.admin.announcementProposals},
  {label:'Geri Bildirimler',to:ROUTES.admin.feedback},
  {label:'Raporlar',to:ROUTES.admin.reports},
]
export function AdminNavigation() {
  return <nav aria-label="Yönetim paneli sekmeleri" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2">
    {ADMIN_TABS.map(({label,to,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>`whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${isActive?'border-primary bg-brand-soft text-on-brand-soft':'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg'}`}>{label}</NavLink>)}
  </nav>
}
export function AdminDemoNotice() {return <div className="mb-5"><DemoNotice>Yönetim panelindeki bütün onaylar, hesap değişiklikleri ve yayınlar yalnızca bu tarayıcı oturumunun demo verilerini etkiler. Gerçek üniversite sistemine gönderilmez.</DemoNotice></div>}
export function AdminMetric({title,value,icon:Icon,helper}){return <Card><div className="flex items-start justify-between gap-2"><p className="text-sm text-fg-muted">{title}</p>{Icon&&<Icon className="size-5 shrink-0 text-brand"/>}</div><p className="mt-3 text-3xl font-semibold tabular-nums">{value??0}</p>{helper&&<p className="mt-1 text-xs text-fg-muted">{helper}</p>}</Card>}
export function StatusBadge({status}){
  const map={new:['Yeni','info'],reviewing:['İnceleniyor','warning'],resolved:['Çözüldü','success'],pending:['Onay bekliyor','warning'],draft:['Taslak','neutral'],approved:['Onaylandı','success'],rejected:['Reddedildi','danger'],published:['Yayında (demo)','success'],archived:['Arşivlendi','neutral'],demo:['Örnek kayıt','warning']}
  const [label,tone]=map[status]||['Bilinmiyor','neutral'];return <Badge tone={tone}>{label}</Badge>
}
export const dateShort = v=>v&&!Number.isNaN(Date.parse(v))?new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium'}).format(new Date(v)):'—'
export const searchMatch=(row,q)=>JSON.stringify(row).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR'))
export function DecisionModal({item,onClose,onDecision,kind='öneri'}){
  const [choice,setChoice]=useState('approved'),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const submit=async()=>{
    if(choice==='rejected'&&!reason.trim()){setError('Ret gerekçesi yazmalısın.');return}
    setBusy(true);setError('')
    try{await onDecision(item.id,choice,reason);onClose()}
    catch(e){setError(e?.message||'İşlem tamamlanamadı.')}
    finally{setBusy(false)}
  }
  return <Modal open={Boolean(item)} onClose={busy?undefined:onClose} title={`${kind} değerlendirmesi`} description={item.title||item.fullName||item.email} size="md" footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Vazgeç</Button><Button onClick={submit} loading={busy}>{choice==='approved'?'Onayla':'Reddet'}</Button></>}>
    <div className="space-y-4"><p className="text-sm text-fg-muted">Bu işlem yalnızca demo kayıtlarını günceller. Kararı vermeden önce ilgili bilgileri kontrol et.</p>
      <fieldset><legend className="mb-2 text-sm font-medium">Karar</legend><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><input type="radio" checked={choice==='approved'} onChange={()=>setChoice('approved')}/> Onayla</label><label className="flex items-center gap-2 text-sm"><input type="radio" checked={choice==='rejected'} onChange={()=>setChoice('rejected')}/> Reddet</label></div></fieldset>
      {choice==='rejected'&&<Textarea label="Ret gerekçesi" value={reason} maxLength={500} rows={3} onChange={e=>setReason(e.target.value)} required/>}
      {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  </Modal>
}
