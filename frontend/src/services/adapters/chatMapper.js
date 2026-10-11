import { AppError } from './AppError'

const invalid = () => { throw new AppError({ status: 502, code: 'invalid_response', message: 'Sohbet servisi beklenmeyen bir yanıt gönderdi.' }) }
const arrayOf = (data) => Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.results) ? data.results : invalid()

function source(raw) {
  return {
    documentId: raw.document_id ?? raw.documentId ?? null,
    title: String(raw.title || raw.document_title || 'Kaynak belge'),
    page: raw.page ?? null,
    article: raw.article ?? null,
    url: raw.url || raw.file_url || null,
    snippet: raw.snippet || raw.content || null,
    content: raw.snippet || raw.content || null,
  }
}

export function mapMessage(raw) {
  if (!raw || raw.id == null || !['user', 'assistant'].includes(raw.role)) invalid()
  return {
    id: String(raw.id),
    role: raw.role,
    content: String(raw.content ?? ''),
    createdAt: raw.created_at || raw.createdAt || null,
    editedAt: raw.edited_at || raw.editedAt || null,
    answerStatus: raw.answer_status || raw.answerStatus || null,
    responseTimeMs: raw.response_time_ms ?? raw.responseTimeMs ?? null,
    sources: Array.isArray(raw.sources) ? raw.sources.map(source) : [],
    feedback: raw.feedback ?? null,
    reportStatus: raw.report_status || raw.reportStatus || null,
  }
}

export function mapConversation(raw) {
  if (!raw || raw.id == null) invalid()
  return {
    id: String(raw.id),
    title: String(raw.title || 'Yeni sohbet'),
    category: raw.category || null,
    createdAt: raw.created_at || raw.createdAt || null,
    updatedAt: raw.updated_at || raw.updatedAt || null,
    messageCount: raw.message_count ?? raw.messageCount ?? raw.messages?.length ?? 0,
    ...(Array.isArray(raw.messages) ? { messages: raw.messages.map(mapMessage) } : {}),
  }
}

export const mapConversations = (data) => arrayOf(data).map(mapConversation)

export function mapHomeOverview(raw) {
  const source = raw?.summary || raw?.stats || {}
  return {
    summary: {
      totalQuestions: source.total_questions ?? source.totalQuestions ?? null,
      answeredCount: source.answered_count ?? source.answeredCount ?? null,
      unansweredCount: source.unanswered_count ?? source.unansweredCount ?? null,
      insufficientCount: source.insufficient_count ?? source.insufficientCount ?? null,
      conversationCount: source.conversation_count ?? source.conversationCount ?? null,
    },
    announcements: Array.isArray(raw?.announcements) ? raw.announcements.map((a) => ({
      id: String(a.id), title: String(a.title || ''), description: String(a.description || a.summary || ''),
      date: a.published_at || a.date || null,
    })) : [],
    isDemo: false,
  }
}


