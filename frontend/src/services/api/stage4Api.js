import { http } from './httpClient'
import { mapAnnouncement, mapAnnouncements, mapDocument, mapDocuments, mapFaqs, mapStats } from '@/services/adapters/stage4Mapper'

// Endpoint paths are proposals; Django backend team MUST validate before api mode is enabled.
const doc = (id) => `/documents/${encodeURIComponent(id)}/`
const ann = (id) => `/announcements/${encodeURIComponent(id)}/`
export const statsApi = {
  async getGeneralStats() { return mapStats(await http.get('/stats/general/')) },
  async getMyStats(period = 'all') { return mapStats(await http.get('/stats/me/', { query: { period } })) },
}
export const documentsApi = {
  async getDocuments() { return mapDocuments(await http.get('/documents/')) },
  async getDocumentById(id) { return mapDocument(await http.get(doc(id))) },
}
export const faqApi = { async getFaqs() { return mapFaqs(await http.get('/faqs/')) } }
export const announcementsApi = {
  async getPublishedAnnouncements() { return mapAnnouncements(await http.get('/announcements/')) },
  async getAnnouncementById(id) { return mapAnnouncement(await http.get(ann(id))) },
}
