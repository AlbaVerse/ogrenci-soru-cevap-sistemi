/** Django REST API taslağı: endpoint ve JSON şekilleri backend tarafından henüz onaylanmadı. */
import { http } from './httpClient'
import { request } from './httpClient'

const list = (payload) => Array.isArray(payload) ? payload : (payload?.items || payload?.results || [])
const base = '/staff/'
const normalizeStatus = (value) => value === 'in_review' ? 'reviewing' : value
const mapQuestion = (x) => ({ id: String(x.id), question: x.question ?? x.content ?? '', category: x.category ?? 'Diğer', status: normalizeStatus(x.status || 'new'), answerStatus: x.answerStatus ?? x.answer_status, createdAt: x.createdAt ?? x.created_at, isDemo: false })
const mapProposal = (x) => ({
  id: String(x.id), title: x.title ?? '', category: x.category ?? '', description: x.description ?? '', content: x.content ?? '',
  status: x.status, proposalType: x.proposalType ?? x.proposal_type ?? 'new',
  documentDate: x.documentDate ?? x.document_date, documentId: x.documentId ?? x.document_id,
  fileName: x.fileName ?? x.file_name, createdAt: x.createdAt ?? x.created_at, updatedAt: x.updatedAt ?? x.updated_at,
  rejectionReason: x.rejectionReason ?? x.rejection_reason, isDemo: false,
})
const docBody = (p) => {
  const body = new FormData()
  body.set('proposal_type', p.proposalType)
  body.set('title', p.title)
  body.set('category', p.category)
  body.set('document_date', p.documentDate)
  body.set('description', p.description)
  if (p.documentId) body.set('document_id', p.documentId)
  if (p.file instanceof File) body.set('file', p.file)
  return body
}
const mapStats = (x) => ({
  assignedQuestions: x.assignedQuestions ?? x.assigned_questions ?? 0,
  newQuestions: x.newQuestions ?? x.new_questions ?? 0,
  reviewingQuestions: x.reviewingQuestions ?? x.reviewing_questions ?? 0,
  resolvedQuestions: x.resolvedQuestions ?? x.resolved_questions ?? 0,
  documentProposals: x.documentProposals ?? x.document_proposals ?? 0,
  announcementProposals: x.announcementProposals ?? x.announcement_proposals ?? 0,
  proposalPending: x.proposalPending ?? x.proposal_pending ?? 0,
  categories: (x.categories ?? x.category_breakdown ?? []).map((c) => ({name:c.name ?? c.category, count:c.count ?? 0})),
  isDemo: false,
})
export const staffApi = {
  async getDashboard() {
    const x = await http.get(`${base}dashboard/`)
    return { pendingQuestions: x.pendingQuestions ?? x.pending_questions ?? 0, pendingDocumentProposals: x.pendingDocumentProposals ?? x.pending_document_proposals ?? 0, pendingAnnouncementProposals: x.pendingAnnouncementProposals ?? x.pending_announcement_proposals ?? 0, recentQuestions: list(x.recentQuestions ?? x.recent_questions).map(mapQuestion), recentProposals: list(x.recentProposals ?? x.recent_proposals).map(mapProposal), isDemo: false }
  },
  async listQuestions() { return list(await http.get('/management/feedback/')).map(mapQuestion) },
  async updateQuestionStatus(id, status) { return mapQuestion(await http.patch(`/management/feedback/${encodeURIComponent(id)}/`, { status })) },
  async listDocumentProposals() { return list(await http.get('/document-proposals/')).map(mapProposal) },
  async createDocumentProposal(data) { return mapProposal(await request('/document-proposals/', {method:'POST',body:docBody(data)})) },
  async listAnnouncementProposals() { return list(await http.get('/announcement-proposals/')).map(mapProposal) },
  async createAnnouncementProposal(data) { return mapProposal(await http.post('/announcement-proposals/', {title:data.title,content:data.content,category:data.category,status:data.status})) },
  async updateAnnouncementProposal(id, data) { return mapProposal(await http.patch(`/announcement-proposals/${encodeURIComponent(id)}/`, {title:data.title,content:data.content,category:data.category,status:data.status})) },
  async getStaffStats() { return mapStats(await http.get(`${base}stats/`)) },
}
