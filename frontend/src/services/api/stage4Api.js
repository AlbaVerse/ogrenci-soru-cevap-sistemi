import { http } from "./httpClient"
import { mapAnnouncement, mapAnnouncements, mapDocument, mapDocuments, mapFaqs, mapStats } from "@/services/adapters/stage4Mapper"

const doc = (id) => `/documents/${encodeURIComponent(id)}/`
const ann = (id) => `/announcements/${encodeURIComponent(id)}/`

export const statsApi = {
  async getGeneralStats() {
    const raw = await http.get("/analytics/dashboard/")
    const adapted = {
      total_questions: raw.total_questions,
      answered_count: raw.solved_count,
      unanswered_count: raw.unsolved_count,
      insufficient_count: 0,
      average_response_time_ms: raw.avg_response_time_ms,
      category_breakdown: (raw.category_distribution || []).map((c) => ({
        category: c.category_name,
        total: c.question_count,
      })),
      daily_trend: raw.daily_trend || raw.time_series || [],
      is_demo: false,
    }
    return mapStats(adapted)
  },
  async getMyStats(period = "all") {
    return mapStats(await http.get("/stats/me/", { query: { period } }))
  },
}

export const documentsApi = {
  async getDocuments() { return mapDocuments(await http.get("/documents/")) },
  async getDocumentById(id) { return mapDocument(await http.get(doc(id))) },
}

export const faqApi = {
  async getFaqs() { return mapFaqs(await http.get("/faqs/")) },
}

export const announcementsApi = {
  async getPublishedAnnouncements() { return mapAnnouncements(await http.get("/announcements/")) },
  async getAnnouncementById(id) { return mapAnnouncement(await http.get(ann(id))) },
}

