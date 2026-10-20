import { http } from "./httpClient"
import { mapConversation, mapConversations, mapMessage } from "@/services/adapters/chatMapper"

const STORAGE_KEY = "albaverse_chat_sessions"

// Backend session_id'yi UUID v4 olarak doğrular. crypto.randomUUID yalnızca güvenli bağlamda
// (https / localhost) vardır; http://<LAN-IP> üzerinde olmadığı için yedek üretici gerekir.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isUuid = (v) => typeof v === "string" && UUID_V4.test(v)
function generateUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const h = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStorage(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch (err) {
    console.error("Storage save error:", err)
  }
}

export const chatApi = {
  async listConversations() {
    const sessions = loadStorage()
    const list = Object.values(sessions).map((c) => ({
      id: c.id,
      title: (c.title && c.title !== "Yeni sohbet") ? c.title : ((c.messages || []).find((m) => m.role === "user")?.content?.slice(0, 35) || c.title || "Yeni sohbet"),
      created_at: c.created_at,
      updated_at: c.updated_at,
      message_count: Array.isArray(c.messages) ? c.messages.length : 0,
    }))
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return mapConversations(list)
  },

  async getConversation(id) {
    const sessions = loadStorage()
    const conv = sessions[id]
    return conv ? mapConversation(conv) : null
  },

  async createConversation(params) {
    const newId = generateUuid()
    const now = new Date().toISOString()
    const newConv = {
      id: newId,
      title: "Yeni sohbet",
      category: params?.category || null,
      created_at: now,
      updated_at: now,
      messages: [],
    }
    const sessions = loadStorage()
    sessions[newId] = newConv
    saveStorage(sessions)
    return mapConversation(newConv)
  },

  async renameConversation(id, title) {
    const sessions = loadStorage()
    if (sessions[id]) {
      sessions[id].title = title
      saveStorage(sessions)
      return mapConversation(sessions[id])
    }
    return null
  },

  async deleteConversation(id) {
    const sessions = loadStorage()
    delete sessions[id]
    saveStorage(sessions)
    return true
  },

  async sendMessage(id, content) {
    const sessionId = id || generateUuid()

    // UUID olmayan eski yerel oturum kimliklerinde session_id gönderilmez (backend yenisini üretir).
    const response = await http.post("/chat/query/", {
      question: content,
      ...(isUuid(sessionId) ? { session_id: sessionId } : {}),
    })

    const now = new Date().toISOString()

    const userMsgRaw = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content,
      created_at: now,
      sources: [],
    }

    const sourcesFormatted = Array.isArray(response?.sources)
      ? response.sources.map((s, idx) => ({
          document_id: s.id || idx + 1,
          title: s.title || s.source_file || "Mevzuat Kaynağı",
          article: s.article || null,
          page: s.page || null,
          snippet: s.snippet || s.text || s.content || "",
          content: s.snippet || s.text || s.content || "",
          url: s.source_file ? `/media/${s.source_file}` : null,
        }))
      : []

    const assistantMsgRaw = {
      id: String(response?.question_id || `bot-${Date.now()}`),
      role: "assistant",
      content: response?.answer || "Yanıt alınamadı.",
      created_at: now,
      response_time_ms: response?.response_time_ms ?? null,
      sources: sourcesFormatted,
    }

    const sessions = loadStorage()
    let conv = sessions[sessionId]
    if (!conv) {
      conv = {
        id: sessionId,
        title: content.slice(0, 32),
        created_at: now,
        updated_at: now,
        messages: [],
      }
    }
    if (!conv.title || conv.title === "Yeni sohbet") {
      conv.title = content.trim().length > 35 ? content.trim().slice(0, 35) + "..." : content.trim()
    }
    conv.messages.push(userMsgRaw, assistantMsgRaw)
    conv.updated_at = now
    sessions[sessionId] = conv
    saveStorage(sessions)

    return {
      conversation: mapConversation(conv),
      userMessage: mapMessage(userMsgRaw),
      assistantMessage: mapMessage(assistantMsgRaw),
    }
  },

  async editMessage(conversationId, messageId, content) {
    return this.sendMessage(conversationId, content)
  },

  async regenerateMessage(conversationId) {
    return this.getConversation(conversationId)
  },

  async setFeedback() {
    return true
  },

  async reportQuestion() {
    return true
  },
}

export const homeApi = {
  async getOverview() {
    return { summary: {}, announcements: [] }
  },
}
