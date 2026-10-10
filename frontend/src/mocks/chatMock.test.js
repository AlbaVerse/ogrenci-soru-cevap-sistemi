import { beforeEach, describe, expect, it } from 'vitest'
import { authMock } from './authMock'
import { chatMock, homeMock } from './chatMock'
import { mockStorage } from './storage'

describe('chatMock — Aşama 3', () => {
  beforeEach(async () => {
    mockStorage.clearAll()
    await authMock.signInAs('student')
  })

  it('sohbet oluşturur, soru ve yanıtı kaydeder', async () => {
    const created = await chatMock.createConversation({ category: 'Staj İşlemleri' })
    const response = await chatMock.sendMessage(created.id, 'Staj yönergesine nasıl ulaşabilirim?')
    expect(response.conversation.messages).toHaveLength(2)
    expect(response.conversation.messages[0].role).toBe('user')
    expect(response.conversation.messages[1].answerStatus).toBe('insufficient')
    expect(response.conversation.messages[1].sources).toEqual([])
    const again = await chatMock.getConversation(created.id)
    expect(again.messages).toHaveLength(2)
  })

  it('soruyu düzenlediğinde sonraki bağlamı temizler', async () => {
    const c = await chatMock.createConversation()
    const first = await chatMock.sendMessage(c.id, 'İlk soru')
    await chatMock.sendMessage(c.id, 'İkinci soru')
    const updated = await chatMock.editMessage(c.id, first.userMessage.id, 'Değişen soru')
    expect(updated.messages).toHaveLength(2)
    expect(updated.messages[0].content).toBe('Değişen soru')
  })

  it('cevapsız soru bildirimi ve geri bildirimi saklar', async () => {
    const c = await chatMock.createConversation()
    const { assistantMessage } = await chatMock.sendMessage(c.id, 'Belgesiz bir soru')
    const rated = await chatMock.setFeedback(c.id, assistantMessage.id, 'negative')
    expect(rated.feedback).toBe('negative')
    const reported = await chatMock.reportQuestion(c.id, assistantMessage.id)
    expect(reported.reportStatus).toBe('new')
  })

  it('sohbetler kullanıcı kimliğine göre ayrılır', async () => {
    const c = await chatMock.createConversation()
    await authMock.signInAs('staff')
    const staff = await chatMock.listConversations()
    expect(staff.some((item) => item.id === c.id)).toBe(false)
    await authMock.signInAs('student')
    expect((await chatMock.listConversations()).some((item) => item.id === c.id)).toBe(true)
  })

  it('ana sayfada sadece demo istatistiğini gösterir', async () => {
    const overview = await homeMock.getOverview()
    expect(overview.isDemo).toBe(true)
    expect(overview.summary.totalQuestions).toBeGreaterThanOrEqual(0)
  })
})
