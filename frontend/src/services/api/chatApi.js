import { http } from './httpClient'
import { mapConversation, mapConversations, mapHomeOverview, mapMessage } from '@/services/adapters/chatMapper'

// TASLAK API: gerçek Django sözleşmesi netleşince yalnızca bu dosya ve mapper değiştirilir.
const conversations = '/conversations/'
const conversation = (id) => `${conversations}${encodeURIComponent(id)}/`
const message = (id) => `/messages/${encodeURIComponent(id)}/`

export const chatApi = {
  async listConversations({ search = '' } = {}) {
    return mapConversations(await http.get(conversations, { query: { search } }))
  },
  async getConversation(id) {
    return mapConversation(await http.get(conversation(id)))
  },
  async createConversation({ category = null } = {}) {
    return mapConversation(await http.post(conversations, { category }))
  },
  async renameConversation(id, title) {
    return mapConversation(await http.patch(conversation(id), { title }))
  },
  async deleteConversation(id) {
    await http.delete(conversation(id))
    return true
  },
  // Yanıtta { conversation, user_message, assistant_message } veya doğrudan conversation nesnesi kabul edilir.
  async sendMessage(id, content) {
    const data = await http.post(`${conversation(id)}messages/`, { content })
    if (data?.conversation) return {
      conversation: mapConversation(data.conversation),
      userMessage: data.user_message ? mapMessage(data.user_message) : null,
      assistantMessage: data.assistant_message ? mapMessage(data.assistant_message) : null,
    }
    return { conversation: mapConversation(data), userMessage: null, assistantMessage: null }
  },
  async editMessage(conversationId, messageId, content) {
    return mapConversation(await http.patch(message(messageId), { content, conversation_id: conversationId, regenerate: true, truncate_following: true }))
  },
  async regenerateMessage(conversationId, messageId) {
    return mapConversation(await http.post(`${message(messageId)}regenerate/`, { conversation_id: conversationId }))
  },
  async setFeedback(conversationId, messageId, rating) {
    return mapMessage(await http.post(`${message(messageId)}feedback/`, { conversation_id: conversationId, rating }))
  },
  async reportQuestion(conversationId, messageId) {
    return mapMessage(await http.post('/question-reports/', { conversation_id: conversationId, message_id: messageId }))
  },
}

export const homeApi = {
  async getOverview() {
    // İki API taslaktır. Kısmi hata diğer ekranları etkilememeli.
    const [stats, announcements] = await Promise.allSettled([
      http.get('/stats/me/'), http.get('/announcements/', { query: { limit: 3 } }),
    ])
    if (stats.status === 'rejected' && announcements.status === 'rejected') throw stats.reason
    const rawAnn = announcements.status === 'fulfilled' ? announcements.value : []
    const records = Array.isArray(rawAnn) ? rawAnn : rawAnn?.items || rawAnn?.results || []
    return mapHomeOverview({ summary: stats.status === 'fulfilled' ? stats.value : {}, announcements: records })
  },
}
