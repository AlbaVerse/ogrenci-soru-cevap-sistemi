import { authMock } from './authMock'
import { delay, mockStorage } from './storage'
import { demoAnnouncements, seedConversations } from './data/chatSeed'
import { AppError } from '@/services/adapters/AppError'

const copy = (data) => structuredClone(data)
const timestamp = () => new Date().toISOString()
const id = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`)
const fail = (code, message, status = 404) => { throw new AppError({ code, message, status }) }

async function getContext() {
  const user = await authMock.getSession()
  if (!user?.id) fail('unauthenticated', 'Önce giriş yapmalısın.', 401)
  const key = `chat.${user.id}`
  let state = mockStorage.read(key)
  if (!state || !Array.isArray(state.conversations)) {
    state = { conversations: seedConversations() }
    mockStorage.write(key, state)
  }
  return { key, state }
}

async function save(transform) {
  const { key, state } = await getContext()
  const result = transform(state)
  mockStorage.write(key, state)
  await delay(150)
  return copy(result)
}

function getConversation(state, conversationId) {
  const conversation = state.conversations.find((item) => item.id === String(conversationId))
  if (!conversation) fail('not_found', 'Bu sohbet bulunamadı.')
  return conversation
}

function getMessage(conversation, messageId, role) {
  const message = conversation.messages.find((item) => item.id === String(messageId) && (!role || item.role === role))
  if (!message) fail('not_found', 'Mesaj bulunamadı.')
  return message
}

function fakeAnswer(question) {
  const related = /(staj|ders|sınav|sinav|burs|yönetmelik|yonetmelik|kayıt|kayit|öğrenci|ogrenci)/i.test(question)
  return {
    role: 'assistant',
    content: related
      ? 'Bu yanıt yalnızca **AlbaVerse demo arayüzünü** göstermek amacıyla oluşturuldu. Sorunla ilgili kesin koşullar için güncel üniversite mevzuatı doğrulanmalıdır. Django ve belge arama servisi bağlanana kadar kesin bilgi veremiyorum.'
      : 'Bu soruya ilişkin doğrulanmış bir üniversite mevzuatı bilgisi bulunamadı. **Demo modunda canlı mevzuat araması yapılmıyor.** Soruyu incelenmek üzere bildirebilirsin.',
    answerStatus: related ? 'insufficient' : 'unanswered',
    sources: [],
    responseTimeMs: null,
    feedback: null,
    reportStatus: null,
  }
}

function summarize(state) {
  const conversations = state.conversations
  const answers = conversations.flatMap((c) => c.messages.filter((m) => m.role === 'assistant'))
  const count = (status) => answers.filter((m) => m.answerStatus === status).length
  return {
    totalQuestions: answers.length,
    answeredCount: count('answered'),
    unansweredCount: count('unanswered'),
    insufficientCount: count('insufficient'),
    conversationCount: conversations.length,
  }
}

export const chatMock = {
  async listConversations({ search = '' } = {}) {
    const { state } = await getContext()
    await delay()
    const term = search.trim().toLocaleLowerCase('tr')
    return copy(state.conversations
      .filter((c) => !term || c.title.toLocaleLowerCase('tr').includes(term) || c.messages.some((m) => m.content.toLocaleLowerCase('tr').includes(term)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ id: chatId, title, updatedAt, messages, category }) => ({ id: chatId, title, updatedAt, messageCount: messages.length, category })))
  },
  async getConversation(conversationId) {
    const { state } = await getContext()
    await delay()
    return copy(getConversation(state, conversationId))
  },
  async createConversation({ category = null } = {}) {
    return save((state) => {
      const createdAt = timestamp()
      const conversation = { id: id(), title: 'Yeni sohbet', category, createdAt, updatedAt: createdAt, messages: [] }
      state.conversations.unshift(conversation)
      return conversation
    })
  },
  async renameConversation(conversationId, title) {
    const cleanTitle = title?.trim()
    if (!cleanTitle || cleanTitle.length > 100) fail('invalid_title', 'Başlık 1-100 karakter arasında olmalı.', 422)
    return save((state) => {
      const c = getConversation(state, conversationId)
      c.title = cleanTitle
      c.updatedAt = timestamp()
      return c
    })
  },
  async deleteConversation(conversationId) {
    return save((state) => {
      const index = state.conversations.findIndex((c) => c.id === String(conversationId))
      if (index === -1) fail('not_found', 'Bu sohbet bulunamadı.')
      state.conversations.splice(index, 1)
      return true
    })
  },
  async sendMessage(conversationId, content) {
    const question = content?.trim()
    if (!question || question.length > 5000) fail('invalid_message', 'Soru 1-5000 karakter arasında olmalı.', 422)
    return save((state) => {
      const c = getConversation(state, conversationId)
      const createdAt = timestamp()
      const userMessage = { id: id(), role: 'user', content: question, createdAt }
      const assistantMessage = { id: id(), ...fakeAnswer(question), createdAt: timestamp() }
      c.messages.push(userMessage, assistantMessage)
      if (c.title === 'Yeni sohbet') c.title = question.slice(0, 65) + (question.length > 65 ? '…' : '')
      c.updatedAt = timestamp()
      return { conversation: c, userMessage, assistantMessage }
    })
  },
  async editMessage(conversationId, messageId, content) {
    const question = content?.trim()
    if (!question || question.length > 5000) fail('invalid_message', 'Soru 1-5000 karakter arasında olmalı.', 422)
    return save((state) => {
      const c = getConversation(state, conversationId)
      const index = c.messages.findIndex((m) => m.id === String(messageId) && m.role === 'user')
      if (index === -1) fail('not_found', 'Düzenlenecek soru bulunamadı.')
      c.messages[index].content = question
      c.messages[index].editedAt = timestamp()
      // Bir önceki soruyu değiştirmek sonraki cevapların bağlamını geçersiz kılar.
      c.messages.splice(index + 1)
      const assistantMessage = { id: id(), ...fakeAnswer(question), createdAt: timestamp() }
      c.messages.push(assistantMessage)
      c.updatedAt = timestamp()
      return c
    })
  },
  async regenerateMessage(conversationId, messageId) {
    return save((state) => {
      const c = getConversation(state, conversationId)
      const last = c.messages.at(-1)
      if (last?.id !== String(messageId) || last.role !== 'assistant') {
        fail('not_last_answer', 'Yalnızca son yanıt yeniden oluşturulabilir.', 409)
      }
      const question = [...c.messages].reverse().find((m) => m.role === 'user')?.content
      if (!question) fail('not_found', 'Bu yanıta ait soru bulunamadı.')
      const replacement = { id: id(), ...fakeAnswer(question), createdAt: timestamp() }
      c.messages[c.messages.length - 1] = replacement
      c.updatedAt = timestamp()
      return c
    })
  },
  async setFeedback(conversationId, messageId, rating) {
    if (!['positive', 'negative', null].includes(rating)) fail('invalid_rating', 'Geçersiz geri bildirim.', 422)
    return save((state) => {
      const message = getMessage(getConversation(state, conversationId), messageId, 'assistant')
      message.feedback = rating
      return message
    })
  },
  async reportQuestion(conversationId, messageId) {
    return save((state) => {
      const message = getMessage(getConversation(state, conversationId), messageId, 'assistant')
      if (!['unanswered', 'insufficient'].includes(message.answerStatus)) fail('invalid_status', 'Bu yanıt için bildirim gönderilemiyor.', 422)
      message.reportStatus = 'new'
      return message
    })
  },
}

export const homeMock = {
  async getOverview() {
    const { state } = await getContext()
    await delay()
    return { summary: copy(summarize(state)), announcements: copy(demoAnnouncements), isDemo: true }
  },
}
