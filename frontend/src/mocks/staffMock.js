/** Personel demo verisi. Resmî üniversite kaydı veya gerçek bir onay işlemi değildir. */
import { authMock } from './authMock'
import { mockStorage, delay } from './storage'
import { AppError } from '@/services/adapters/AppError'

const KEY = 'staff.management.v1'
const duplicate = (value) => structuredClone(value)
const now = () => new Date().toISOString()
const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null) || `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`
const error = (status, code, message) => { throw new AppError({ status, code, message }) }
const CATEGORIES = ['Staj İşlemleri', 'Dersler ve Sınavlar', 'Öğrenci İşleri', 'Burslar', 'Yönetmelikler']

const seed = () => ({
  questions: [
    { id: 'staff-q1', category: 'Staj İşlemleri', question: 'Staj evrak teslimi için güncel yönerge bulunamadı.', status: 'new', answerStatus: 'unanswered', createdAt: '2026-10-07T10:30:00Z', isDemo: true },
    { id: 'staff-q2', category: 'Dersler ve Sınavlar', question: 'Mazeret sınavı başvuru süresine ilişkin bilgi yetersiz.', status: 'reviewing', answerStatus: 'insufficient', createdAt: '2026-10-08T13:15:00Z', isDemo: true },
    { id: 'staff-q3', category: 'Öğrenci İşleri', question: 'Belge teslimiyle ilgili soru için kaynak doğrulanamadı.', status: 'resolved', answerStatus: 'unanswered', createdAt: '2026-10-02T08:00:00Z', isDemo: true },
    { id: 'staff-q4', category: 'Staj İşlemleri', question: 'Yurt dışında staj başvuru adımları açıklığa kavuşturulamadı.', status: 'new', answerStatus: 'insufficient', createdAt: '2026-10-09T16:20:00Z', isDemo: true },
  ],
  documentProposals: [],
  announcementProposals: [],
})

async function ensureStaff() {
  const user = await authMock.getSession()
  if (!user) error(401, 'unauthenticated', 'Oturum açmalısın.')
  if (user.role !== 'staff') error(403, 'forbidden', 'Bu işlem için personel yetkisi gerekiyor.')
  return user
}

function read() {
  const state = mockStorage.read(KEY)
  if (state && Array.isArray(state.questions) && Array.isArray(state.documentProposals) && Array.isArray(state.announcementProposals)) return state
  const initial = seed()
  mockStorage.write(KEY, initial)
  return initial
}
function write(state) { mockStorage.write(KEY, state) }

/** Admin mock ile aynı örnek soru/öneri kayıtlarını başlatır ve okur. */
export const getSharedStaffDemoState = () => read()
const normalize = (value, max = 200) => String(value ?? '').trim().slice(0, max)
function required(value, field, max) {
  const text = normalize(value, max)
  if (!text) error(422, 'validation_error', `${field} boş bırakılamaz.`)
  return text
}
const own = (items, id, user) => {
  const item = items.find((entry) => entry.id === String(id) && entry.createdBy === user.id)
  if (!item) error(404, 'not_found', 'Bu öneri bulunamadı.')
  return item
}
function ownerItems(items, user) { return items.filter((item) => item.createdBy === user.id) }

export const staffMock = {
  async getDashboard() {
    const user = await ensureStaff(); const state = read(); await delay()
    const docs = ownerItems(state.documentProposals, user)
    const news = ownerItems(state.announcementProposals, user)
    return duplicate({
      pendingQuestions: state.questions.filter((q) => q.status !== 'resolved').length,
      pendingDocumentProposals: docs.filter((p) => p.status === 'pending').length,
      pendingAnnouncementProposals: news.filter((p) => p.status === 'pending').length,
      recentQuestions: state.questions.filter((q) => q.status !== 'resolved').slice(0, 3),
      recentProposals: [...docs, ...news].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
      isDemo: true,
    })
  },
  async listQuestions() { await ensureStaff(); await delay(); return duplicate(read().questions) },
  async updateQuestionStatus(id, status) {
    await ensureStaff()
    if (!['new', 'reviewing', 'resolved'].includes(status)) error(422, 'invalid_status', 'Geçersiz inceleme durumu.')
    const state = read()
    const question = state.questions.find((q) => q.id === String(id))
    if (!question) error(404, 'not_found', 'Soru bulunamadı.')
    question.status = status; question.updatedAt = now(); write(state); await delay()
    return duplicate(question)
  },
  async listDocumentProposals() {
    const user = await ensureStaff(); await delay()
    return duplicate(ownerItems(read().documentProposals, user).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },
  async createDocumentProposal(values) {
    const user = await ensureStaff()
    const type = values.proposalType === 'update' ? 'update' : 'new'
    const title = required(values.title, 'Başlık', 160)
    const category = required(values.category, 'Kategori', 80)
    if (!CATEGORIES.includes(category)) error(422, 'invalid_category', 'Geçersiz kategori.')
    const description = required(values.description, 'Açıklama', 1200)
    const documentDate = required(values.documentDate, 'Belge tarihi', 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(documentDate) || Number.isNaN(Date.parse(`${documentDate}T00:00:00Z`))) error(422, 'invalid_date', 'Geçerli bir tarih seç.')
    const documentId = type === 'update' ? required(values.documentId, 'Değiştirilecek belge', 100) : null
    const fileName = normalize(values.fileName, 250) || null
    if (type === 'new' && !fileName) error(422, 'file_required', 'Yeni belge önerisinde PDF seçmelisin.')
    if (fileName && !fileName.toLowerCase().endsWith('.pdf')) error(422, 'invalid_file', 'Yalnızca PDF kabul edilir.')
    const state = read()
    const proposal = { id: uid(), proposalType: type, title, category, description, documentDate, documentId, fileName, fileSize: Number(values.fileSize) || null, status: 'pending', rejectionReason: null, createdBy: user.id, createdAt: now(), updatedAt: now(), isDemo: true, fileStored: false }
    // Demo yalnızca metadata tutar: PDF baytları ne depolanır ne de Django'ya yüklenir.
    state.documentProposals.unshift(proposal); write(state); await delay()
    return duplicate(proposal)
  },
  async listAnnouncementProposals() {
    const user = await ensureStaff(); await delay()
    return duplicate(ownerItems(read().announcementProposals, user).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },
  async createAnnouncementProposal(values) {
    const user = await ensureStaff()
    const title = required(values.title, 'Başlık', 160)
    const content = required(values.content, 'İçerik', 5000)
    const category = required(values.category, 'Kategori', 80)
    const status = values.status === 'draft' ? 'draft' : 'pending'
    const state = read()
    const proposal = { id: uid(), title, content, category, status, rejectionReason: null, createdBy: user.id, createdAt: now(), updatedAt: now(), isDemo: true }
    state.announcementProposals.unshift(proposal); write(state); await delay()
    return duplicate(proposal)
  },
  async updateAnnouncementProposal(id, values) {
    const user = await ensureStaff(); const state = read()
    const item = own(state.announcementProposals, id, user)
    if (item.status !== 'draft') error(409, 'not_draft', 'Yalnızca taslak duyurular düzenlenebilir.')
    item.title = required(values.title, 'Başlık', 160)
    item.content = required(values.content, 'İçerik', 5000)
    item.category = required(values.category, 'Kategori', 80)
    item.status = values.status === 'pending' ? 'pending' : 'draft'
    item.updatedAt = now(); write(state); await delay()
    return duplicate(item)
  },
  async getStaffStats() {
    const user = await ensureStaff(); const state = read(); await delay()
    const docs = ownerItems(state.documentProposals, user)
    const news = ownerItems(state.announcementProposals, user)
    const categories = CATEGORIES.map((name) => ({ name, count: state.questions.filter((q) => q.category === name).length })).filter((x) => x.count > 0)
    return duplicate({
      assignedQuestions: state.questions.length,
      newQuestions: state.questions.filter((q) => q.status === 'new').length,
      reviewingQuestions: state.questions.filter((q) => q.status === 'reviewing').length,
      resolvedQuestions: state.questions.filter((q) => q.status === 'resolved').length,
      documentProposals: docs.length,
      announcementProposals: news.length,
      proposalPending: [...docs, ...news].filter((p) => p.status === 'pending').length,
      categories,
      isDemo: true,
    })
  },
}
export const STAFF_CATEGORIES = CATEGORIES
