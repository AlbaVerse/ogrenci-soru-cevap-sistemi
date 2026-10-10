/** Yönetici işlemleri yalnızca DEMO'dur; Django veritabanında hiçbir değişiklik yapmaz. */
import { authMock } from './authMock'
import { mockStorage, delay } from './storage'
import { DEMO_ACCOUNTS } from './data/users'
import { mapUser } from '@/services/adapters/userMapper'
import { getSharedStaffDemoState } from './staffMock'
import { AppError } from '@/services/adapters/AppError'

const STAFF_KEY = 'staff.management.v1' // personel paneliyle AYNI storage anahtarı
const USERS_KEY = 'users'
const PUBLISHED_KEY = 'admin.published.v1'
const now = () => new Date().toISOString()
const clone = (v) => structuredClone(v)
const uid = () => globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`
const problem = (status, code, message) => { throw new AppError({status, code, message}) }
const clean = (v, max=160) => String(v ?? '').trim().slice(0,max)
const required = (v, name, max) => { const x = clean(v,max); if (!x) problem(422, 'validation_error', `${name} zorunludur.`); return x }
const staffState = () => getSharedStaffDemoState()
const saveStaff = (s) => mockStorage.write(STAFF_KEY,s)
const publishedState = () => mockStorage.read(PUBLISHED_KEY) || { documents: [], announcements: [] }
const savePublished = (s) => mockStorage.write(PUBLISHED_KEY,s)
const savedUserOverrides = () => mockStorage.read(USERS_KEY) || {}
const listRawUsers = () => {
  const all = new Map(Object.values(DEMO_ACCOUNTS).map((x) => [x.raw.email,x.raw]))
  Object.values(savedUserOverrides()).forEach((raw) => all.set(raw.email,raw))
  return [...all.values()].map(mapUser).filter(Boolean)
}
const getUserRaw = (id) => {
  const all = [...Object.values(DEMO_ACCOUNTS).map((x) => x.raw),...Object.values(savedUserOverrides())]
  return all.reverse().find((u) => String(u.id)===String(id))
}
const saveRaw = (raw) => mockStorage.write(USERS_KEY,{ ...savedUserOverrides(), [raw.email]: raw })
async function ensureAdmin() {
  const user = await authMock.getSession()
  if (!user) problem(401,'unauthenticated','Oturum açmalısın.')
  if (user.role !== 'admin') problem(403,'forbidden','Bu işlem için yönetici yetkisi gerekiyor.')
  return user
}
const find = (items,id) => {
  const result = items.find((x)=>String(x.id)===String(id))
  if (!result) problem(404,'not_found','Kayıt bulunamadı.')
  return result
}
const newest = (items) => items.slice().sort((a,b)=>(b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||''))
function decision(item, status, reason) {
  if (item.status !== 'pending') problem(409,'already_reviewed','Yalnızca onay bekleyen öneriler değerlendirilebilir.')
  if (!['approved','rejected'].includes(status)) problem(422,'invalid_status','Geçersiz karar.')
  if (status==='rejected' && !clean(reason,500)) problem(422,'reason_required','Ret gerekçesi zorunludur.')
  item.status=status; item.rejectionReason=status==='rejected'?clean(reason,500):null; item.updatedAt=now()
}
const DOC_CATEGORIES=['Staj İşlemleri','Dersler ve Sınavlar','Öğrenci İşleri','Burslar','Yönetmelikler']
const QUEUE_STATUSES=['new','reviewing','resolved']

export const adminMock = {
  async getDashboard() {
    await ensureAdmin(); const state=staffState(); const users=listRawUsers(); await delay()
    return clone({ users:users.length, pendingStaff:users.filter(u=>u.staffApprovalStatus==='pending'&&u.requestedRole==='staff').length,
      pendingDocuments:state.documentProposals.filter(p=>p.status==='pending').length,
      pendingAnnouncements:state.announcementProposals.filter(p=>p.status==='pending').length,
      pendingFeedback:state.questions.filter(q=>q.status!=='resolved').length,
      recentDocuments:newest(state.documentProposals).slice(0,3),recentAnnouncements:newest(state.announcementProposals).slice(0,3),isDemo:true })
  },
  async listUsers() { await ensureAdmin(); await delay(); return clone(listRawUsers()) },
  async updateUserRole(id,role) {
    await ensureAdmin()
    if (!['student','staff'].includes(role)) problem(422,'invalid_role','Bu işlemde yalnızca öğrenci/personel rolleri düzenlenebilir.')
    const raw=getUserRaw(id)
    if (!raw) problem(404,'not_found','Kullanıcı bulunamadı.')
    if (raw.role==='admin') problem(403,'forbidden','Yönetici rolü bu ekrandan değiştirilemez.')
    raw.role=role; raw.requested_role=role
    raw.staff_approval_status=role==='staff'?'approved':null
    saveRaw(raw); await delay(); return clone(mapUser(raw))
  },
  async listStaffRequests() { await ensureAdmin(); await delay(); return clone(listRawUsers().filter(u=>u.requestedRole==='staff'&&u.role!=='admin'&&u.staffApprovalStatus)) },
  async decideStaffRequest(id,status,reason='') {
    await ensureAdmin()
    if (!['approved','rejected'].includes(status)) problem(422,'invalid_status','Geçersiz karar.')
    if (status==='rejected' && !clean(reason,500)) problem(422,'reason_required','Ret gerekçesi zorunludur.')
    const raw=getUserRaw(id)
    if (!raw || raw.requested_role!=='staff'||raw.staff_approval_status!=='pending') problem(409,'invalid_request','Onay bekleyen personel başvurusu bulunamadı.')
    raw.role=status==='approved'?'staff':'student'; raw.staff_approval_status=status
    // Ret açıklaması yalnızca demo yöneticisi için metadata; mevcut mapUser'a eklenmez.
    raw.staff_rejection_reason=status==='rejected'?clean(reason,500):null
    saveRaw(raw); await delay(); return clone(mapUser(raw))
  },
  async listDocumentProposals() { await ensureAdmin(); await delay(); return clone(newest(staffState().documentProposals)) },
  async decideDocumentProposal(id,status,reason='') {
    await ensureAdmin();const s=staffState();const p=find(s.documentProposals,id);decision(p,status,reason)
    if (status==='approved') {
      // Demo: PDF bytes aren't stored. Approval creates metadata only, NEVER a fake PDF link.
      const pub=publishedState()
      pub.documents.push({id:`approved-${p.id}`,title:p.title,category:p.category,documentDate:p.documentDate,description:p.description,
        fileUrl:null,status:'demo',approvedProposalId:p.id,createdAt:now(),isDemo:true})
      savePublished(pub)
    }
    saveStaff(s);await delay();return clone(p)
  },
  async listDocuments() { await ensureAdmin();await delay();return clone(publishedState().documents) },
  async createDocument(data) {
    await ensureAdmin()
    const title=required(data.title,'Başlık'), category=required(data.category,'Kategori',80), documentDate=required(data.documentDate,'Tarih',10),description=required(data.description,'Açıklama',1200)
    if (!DOC_CATEGORIES.includes(category)) problem(422,'invalid_category','Geçersiz kategori.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(documentDate)||Number.isNaN(Date.parse(`${documentDate}T00:00:00Z`))) problem(422,'invalid_date','Geçerli belge tarihi seçmelisin.')
    const fileName=clean(data.fileName,250)
    if (!fileName.toLowerCase().endsWith('.pdf')) problem(422,'invalid_file','Demo için PDF dosyası seçmelisin.')
    const pub=publishedState()
    const item={id:uid(),title,category,documentDate,description,status:'demo',fileUrl:null,fileName,createdAt:now(),isDemo:true}
    pub.documents.unshift(item);savePublished(pub);await delay();return clone(item)
  },
  async updateDocument(id,data) {
    await ensureAdmin(); const p=publishedState(),item=find(p.documents,id)
    if (item.status==='archived') problem(409,'archived','Arşivdeki belge düzenlenemez.')
    const title=required(data.title,'Başlık'), category=required(data.category,'Kategori',80), documentDate=required(data.documentDate,'Tarih',10), description=required(data.description,'Açıklama',1200)
    if(!DOC_CATEGORIES.includes(category)) problem(422,'invalid_category','Geçersiz kategori.')
    if(!/^\d{4}-\d{2}-\d{2}$/.test(documentDate)||Number.isNaN(Date.parse(`${documentDate}T00:00:00Z`))) problem(422,'invalid_date','Geçerli tarih seç.')
    Object.assign(item,{title,category,documentDate,description,updatedAt:now()})
    // Belge PDF'si demo ortamında yüklenmez ve değiştirilemez.
    savePublished(p);await delay();return clone(item)
  },
  async archiveDocument(id) {
    await ensureAdmin();const p=publishedState(),item=find(p.documents,id)
    item.status='archived';item.updatedAt=now();savePublished(p);await delay();return clone(item)
  },
  async listAnnouncementProposals() {await ensureAdmin();await delay();return clone(newest(staffState().announcementProposals))},
  async decideAnnouncementProposal(id,status,reason='') {
    await ensureAdmin();const s=staffState(),p=find(s.announcementProposals,id);decision(p,status,reason)
    if(status==='approved'){
      const pub=publishedState()
      pub.announcements.push({id:`approved-${p.id}`,title:p.title,content:p.content,category:p.category,
        status:'published',publishedAt:now(),createdAt:now(),isDemo:true,approvedProposalId:p.id})
      savePublished(pub)
    }
    saveStaff(s);await delay();return clone(p)
  },
  async listAnnouncements() {await ensureAdmin();await delay();return clone(newest(publishedState().announcements))},
  async createAnnouncement(data) {
    await ensureAdmin();const pub=publishedState()
    const item={id:uid(),title:required(data.title,'Başlık'),content:required(data.content,'İçerik',5000),
      category:required(data.category,'Kategori',80),status:'published',publishedAt:now(),createdAt:now(),isDemo:true}
    pub.announcements.unshift(item);savePublished(pub);await delay();return clone(item)
  },
  async updateAnnouncement(id,data) {
    await ensureAdmin();const p=publishedState(),item=find(p.announcements,id)
    item.title=required(data.title,'Başlık')
    item.content=required(data.content,'İçerik',5000)
    item.category=required(data.category,'Kategori',80)
    item.updatedAt=now();savePublished(p);await delay();return clone(item)
  },
  async listFeedback() {await ensureAdmin();await delay();return clone(staffState().questions)},
  async updateFeedback(id,status) {
    await ensureAdmin()
    if(!QUEUE_STATUSES.includes(status))problem(422,'invalid_status','Geçersiz inceleme durumu.')
    const s=staffState(),q=find(s.questions,id);q.status=status;q.updatedAt=now();saveStaff(s);await delay();return clone(q)
  },
  async getReports() {
    await ensureAdmin();await delay();const s=staffState();const users=listRawUsers();
    return clone({ totalUsers:users.length,students:users.filter(u=>u.role==='student').length,staff:users.filter(u=>u.role==='staff').length,
      pendingStaff:users.filter(u=>u.staffApprovalStatus==='pending').length,
      questions:s.questions.length, unresolvedQuestions:s.questions.filter(q=>q.status!=='resolved').length,
      documents:s.documentProposals.length,approvedDocuments:s.documentProposals.filter(p=>p.status==='approved').length,
      announcements:s.announcementProposals.length,approvedAnnouncements:s.announcementProposals.filter(p=>p.status==='approved').length,
      categories:[...new Set(s.questions.map(q=>q.category))].map(name=>({name,count:s.questions.filter(q=>q.category===name).length})),isDemo:true })
  }
}
