import { useMemo, useState } from 'react'
import { Page } from '@/components/layout/Page'
import { Button, Card, EmptyState, Input, Select, ConfirmDialog } from '@/components/ui'
import { AdminNavigation, AdminDemoNotice, StatusBadge, searchMatch, dateShort } from '@/components/admin/AdminShared'
import { StatusView } from '@/components/stage4/Shared'
import { adminService } from '@/services'
import { useResource } from '@/hooks/useResource'
import { useToast } from '@/context/toast-context'
const roleName={student:'Öğrenci',staff:'Personel',admin:'Yönetici'}
export function AdminUsersPage(){
  const r=useResource(adminService.listUsers),toast=useToast()
  const [query,setQuery]=useState(''),[role,setRole]=useState('all'),[pending,setPending]=useState(null),[error,setError]=useState('')
  const rows=useMemo(()=>(r.data||[]).filter(x=>(role==='all'||x.role===role)&&searchMatch([x.fullName,x.firstName,x.lastName,x.email],query)),[r.data,role,query])
  async function change(){try{await adminService.updateUserRole(pending.id,pending.role==='staff'?'student':'staff');setPending(null);r.retry();toast.success('Demo kullanıcı rolü güncellendi.')}catch(e){setError(e?.message||'İşlem yapılamadı.');setPending(null)}}
  return <Page title="Kullanıcı Yönetimi" description="Hesapları ve yetkili rollerini görüntüle; demo öğrenci/personel rollerini yönet."><AdminNavigation/><AdminDemoNotice/>
    <Card className="mb-5 grid gap-3 sm:grid-cols-[1fr_230px]"><Input label="Kullanıcı ara" placeholder="Ad veya e-posta" value={query} onChange={e=>setQuery(e.target.value)}/><Select label="Rol" value={role} onChange={e=>setRole(e.target.value)} options={[{value:'all',label:'Tüm roller'},...Object.entries(roleName).map(([value,label])=>({value,label}))]}/></Card>
    {error&&<p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
    <StatusView {...r}>{rows.length?<div className="space-y-3">{rows.map(u=><Card as="article" key={u.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold">{u.fullName||`${u.firstName} ${u.lastName}`}</h2><p className="break-all text-sm text-fg-muted">{u.email}</p><p className="mt-1 text-xs text-fg-muted">Kayıt: {dateShort(u.createdAt)}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium">{roleName[u.role]||u.role}</span>{u.staffApprovalStatus==='pending'&&<StatusBadge status="pending"/>}{u.role!=='admin'&&<Button size="sm" variant="secondary" onClick={()=>setPending(u)}>{u.role==='staff'?'Öğrenci yap':'Personel yap'}</Button>}</div></div></Card>)}</div>:<Card><EmptyState title="Kullanıcı bulunamadı" description="Filtreleri değiştirebilirsin."/></Card>}</StatusView>
    <ConfirmDialog open={Boolean(pending)} onCancel={()=>setPending(null)} onConfirm={change} title="Kullanıcı rolünü değiştir" description={`${pending?.email||''} hesabının rolü ${pending?.role==='staff'?'öğrenci':'personel'} olarak güncellensin mi? Bu işlem yalnızca demo içindir.`}/>
  </Page>
}
