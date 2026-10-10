/** Django endpointleri TASLAKTIR. docs/API_CONTRACT_DRAFT.md ekiple doğrulanmadan API modu kullanılmamalıdır. */
import { http, request } from './httpClient'
const list = (x) => Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : Array.isArray(x?.results) ? x.results : []
const user = (x) => ({
  id:x.id,firstName:x.firstName??x.first_name??'',lastName:x.lastName??x.last_name??'',
  email:x.email??'',role:x.role??'student',requestedRole:x.requestedRole??x.requested_role,
  staffApprovalStatus:x.staffApprovalStatus??x.staff_approval_status??null,
  createdAt:x.createdAt??x.created_at??null,
})
const proposal = x => ({
  id:x.id, title:x.title,category:x.category,status:x.status,
  description:x.description,content:x.content,
  documentDate:x.documentDate??x.document_date, fileName:x.fileName??x.file_name,
  proposalType:x.proposalType??x.proposal_type, createdBy:x.createdBy??x.created_by,
  createdAt:x.createdAt??x.created_at, rejectionReason:x.rejectionReason??x.rejection_reason,
})
const question = x=>({id:x.id,question:x.question,category:x.category,status:x.status,createdAt:x.createdAt??x.created_at,answerStatus:x.answerStatus??x.answer_status})
const files = d => { const f=new FormData();['title','category','description','documentDate'].forEach(k=>f.append(k==='documentDate'?'document_date':k,d[k]??''));if(d.file)f.append('file',d.file);return f }
const decision = (status, reason) => ({status,reason})
export const adminApi = {
  async getDashboard(){ return http.get('/admin/dashboard/') },
  async listUsers(){return list(await http.get('/admin/users/')).map(user)},
  async updateUserRole(id,role){return user(await http.patch(`/admin/users/${encodeURIComponent(id)}/`,{role}))},
  async listStaffRequests(){return list(await http.get('/admin/staff-requests/')).map(user)},
  async decideStaffRequest(id,status,reason){return user(await http.post(`/admin/staff-requests/${encodeURIComponent(id)}/decision/`,decision(status,reason)))},
  async listDocumentProposals(){return list(await http.get('/admin/document-proposals/')).map(proposal)},
  async decideDocumentProposal(id,status,reason){return proposal(await http.post(`/admin/document-proposals/${encodeURIComponent(id)}/decision/`,decision(status,reason)))},
  async listDocuments(){return list(await http.get('/admin/documents/')).map(proposal)},
  async createDocument(values){return proposal(await request('/admin/documents/',{method:'POST',body:files(values)}))},
  async updateDocument(id,values){return proposal(await http.patch(`/admin/documents/${encodeURIComponent(id)}/`,values))},
  async archiveDocument(id){return http.post(`/admin/documents/${encodeURIComponent(id)}/archive/`,{})},
  async listAnnouncementProposals(){return list(await http.get('/admin/announcement-proposals/')).map(proposal)},
  async decideAnnouncementProposal(id,status,reason){return proposal(await http.post(`/admin/announcement-proposals/${encodeURIComponent(id)}/decision/`,decision(status,reason)))},
  async listAnnouncements(){return list(await http.get('/admin/announcements/')).map(proposal)},
  async createAnnouncement(values){return proposal(await http.post('/admin/announcements/',values))},
  async updateAnnouncement(id,values){return proposal(await http.patch(`/admin/announcements/${encodeURIComponent(id)}/`,values))},
  async listFeedback(){return list(await http.get('/admin/feedback/')).map(question)},
  async updateFeedback(id,status){return question(await http.patch(`/admin/feedback/${encodeURIComponent(id)}/`,{status}))},
  async getReports(){return http.get('/admin/reports/')},
}
