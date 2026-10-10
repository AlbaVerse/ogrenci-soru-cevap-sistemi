import { useMemo, useState } from 'react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Input, Select } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, StatusBadge, DecisionModal, dateShort, searchMatch } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { adminService } from '@/services'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'

const types={
  staff:{title:'Personel Başvuruları',desc:'Personel yetkisi isteyen üniversite hesaplarını incele.',fetch:adminService.listStaffRequests,decide:adminService.decideStaffRequest,kind:'Personel başvurusu'},
  documents:{title:'Belge Önerileri',desc:'Personelin önerdiği yeni veya güncellenmiş mevzuat belgelerini değerlendir.',fetch:adminService.listDocumentProposals,decide:adminService.decideDocumentProposal,kind:'Belge önerisi'},
  announcements:{title:'Duyuru Önerileri',desc:'Personelin oluşturduğu duyuruları incele ve yayınlanmasını onayla.',fetch:adminService.listAnnouncementProposals,decide:adminService.decideAnnouncementProposal,kind:'Duyuru önerisi'},
}
export function AdminProposalsPage({type}){
  const config=types[type]
  const r=useResource(config.fetch),toast=useToast()
  const [selected,setSelected]=useState(null),[query,setQuery]=useState(''),[status,setStatus]=useState('pending'),[error,setError]=useState('')
  const rows=useMemo(()=>(r.data||[]).filter(x=>(status==='all'||x.status===status||(type==='staff'&&x.staffApprovalStatus===status))&&searchMatch([x.title,x.email,x.category,x.description,x.content,x.fullName,x.firstName,x.lastName],query)),[r.data,query,status,type])
  async function decide(id,choice,reason){
    try{await config.decide(id,choice,reason);setError('');r.retry();toast.success(choice==='approved'?'Demo onayı kaydedildi.':'Demo ret kararı kaydedildi.')}
    catch(e){setError(e?.message||'Karar kaydedilemedi.');throw e}
  }
  return <Page title={config.title} description={config.desc}><AdminNavigation/><AdminDemoNotice/>
    <Card className="mb-5 grid gap-3 sm:grid-cols-[1fr_230px]"><Input label="Başvurularda ara" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Başlık, kategori veya e-posta"/><Select label="Durum" value={status} onChange={e=>setStatus(e.target.value)} options={[{value:'pending',label:'Onay bekleyenler'},{value:'all',label:'Tümü'},...(type==='staff'?[]:[{value:'approved',label:'Onaylananlar'},{value:'rejected',label:'Reddedilenler'},{value:'draft',label:'Taslaklar'}])]} /></Card>
    {error&&<p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
    <StatusView {...r}>{rows.length?<div className="space-y-3">{rows.map(item=>{
      const statusValue=item.status||item.staffApprovalStatus
      return <Card as="article" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold">{item.title||item.fullName||[item.firstName,item.lastName].filter(Boolean).join(' ')}</h2><p className="mt-1 text-xs text-fg-muted">{item.email||item.category||''} · {dateShort(item.createdAt)}</p></div><div className="flex items-center gap-2"><StatusBadge status={statusValue}/>{statusValue==='pending'&&<Button size="sm" onClick={()=>setSelected({...item,title:item.title||item.fullName||item.email})}>Değerlendir</Button>}</div></div>
        {item.description&&<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{item.description}</p>}
        {item.content&&<p className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">{item.content}</p>}
        {item.fileName&&<p className="mt-2 text-xs text-fg-muted">PDF seçimi: {item.fileName} · Dosyanın kendisi demo modunda saklanmaz.</p>}
        {item.proposalType&&<p className="mt-2 text-xs text-fg-muted">Öneri türü: {item.proposalType==='update'?'Belge güncelleme':'Yeni belge'} · Gönderen kullanıcı ID: {item.createdBy||'—'}</p>}
        {statusValue==='rejected'&&item.rejectionReason&&<p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-sm text-fg">Red gerekçesi: {item.rejectionReason}</p>}
      </Card>})}</div>:<Card><EmptyState title="Başvuru bulunamadı" description="Yeni başvurular burada görünecek veya filtreleri değiştirebilirsin."/></Card>}</StatusView>
    {selected&&<DecisionModal key={selected.id} item={selected} kind={config.kind} onClose={()=>setSelected(null)} onDecision={decide}/>}
  </Page>
}
