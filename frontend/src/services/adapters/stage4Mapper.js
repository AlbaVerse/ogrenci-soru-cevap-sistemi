const items = (raw) => Array.isArray(raw) ? raw : raw?.items ?? raw?.results ?? []
const num = (value, fallback = 0) => Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : fallback
const text = (value) => value == null ? '' : String(value)

export const mapStats = (raw = {}) => ({
  totalQuestions: num(raw.totalQuestions ?? raw.total_questions),
  answeredCount: num(raw.answeredCount ?? raw.answered_count),
  unansweredCount: num(raw.unansweredCount ?? raw.unanswered_count),
  insufficientCount: num(raw.insufficientCount ?? raw.insufficient_count),
  averageResponseTimeMs: num(raw.averageResponseTimeMs ?? raw.average_response_time_ms, null),
  categories: (raw.categories ?? raw.category_breakdown ?? []).map((x) => ({ name: text(x.name ?? x.category), count: num(x.count ?? x.total) })),
  dailyTrend: (raw.dailyTrend ?? raw.daily_trend ?? []).map((x) => ({ date: text(x.date), count: num(x.count ?? x.total) })),
  recentQuestions: (raw.recentQuestions ?? raw.recent_questions ?? []).map((x) => ({ id: text(x.id), title: text(x.title ?? x.question), date: text(x.date ?? x.created_at), category: text(x.category), status: text(x.status ?? x.answer_status), conversationId: text(x.conversationId ?? x.conversation_id) })),
  isDemo: Boolean(raw.isDemo ?? raw.is_demo),
})
export const mapDocument = (x = {}) => ({
  id: text(x.id), title: text(x.title), category: text(x.category), documentDate: text(x.documentDate ?? x.document_date),
  description: text(x.description ?? x.summary), status: text(x.status), fileUrl: x.fileUrl ?? x.file_url ?? null,
})
export const mapDocuments = (raw) => items(raw).map(mapDocument)
export const mapFaqs = (raw) => items(raw).map((x) => ({ id: text(x.id), title: text(x.title ?? x.question), content: text(x.content ?? x.answer), category: text(x.category) }))
export const mapAnnouncement = (x = {}) => ({
  id: text(x.id), title: text(x.title), category: text(x.category), summary: text(x.summary ?? x.description),
  content: text(x.content), publishedAt: text(x.publishedAt ?? x.published_at), status: text(x.status), isDemo: Boolean(x.isDemo ?? x.is_demo),
})
export const mapAnnouncements = (raw) => items(raw).map(mapAnnouncement)
