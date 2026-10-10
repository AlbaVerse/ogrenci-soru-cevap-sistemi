import { describe, expect, it } from 'vitest'
import { mapConversation, mapConversations, mapHomeOverview, mapMessage } from './chatMapper'

describe('chatMapper — API taslağı', () => {
  it('snake_case yanıtı ekran nesnesine dönüştürür', () => {
    const message = mapMessage({ id: 1, role: 'assistant', content: 'Örnek', answer_status: 'answered', sources: [{ document_id: 5, title: 'Yönerge', page: 2, article: 'Madde 4', url: '/api/v1/documents/5/file/' }] })
    expect(message.answerStatus).toBe('answered')
    expect(message.sources[0].documentId).toBe(5)
    expect(message.sources[0].article).toBe('Madde 4')
    const c = mapConversation({ id: 12, title: 'Başlık', updated_at: '2026-10-09', messages: [message] })
    expect(c.id).toBe('12')
    expect(c.messages).toHaveLength(1)
  })
  it('sayfalı liste ve kişisel özet alanlarını kabul eder', () => {
    expect(mapConversations({ items: [{ id: 1, title: 'Sohbet' }] })).toHaveLength(1)
    expect(mapHomeOverview({ summary: { total_questions: 8, answered_count: 3 } }).summary).toMatchObject({ totalQuestions: 8, answeredCount: 3 })
  })
})
