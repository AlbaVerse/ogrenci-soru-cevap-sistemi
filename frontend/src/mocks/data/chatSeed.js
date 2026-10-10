// Kurgusal veriler. Gerçek mevzuat veya üniversite açıklaması değildir.
const now = '2026-10-09T10:15:00.000Z'
export const seedConversations = () => [
  {
    id: 'demo-staj',
    title: 'Staj işlemleri hakkında',
    category: 'Staj İşlemleri',
    createdAt: now,
    updatedAt: now,
    messages: [
      { id: 'demo-q1', role: 'user', content: 'Staj başvurusu hakkında nereden bilgi alabilirim?', createdAt: now },
      {
        id: 'demo-a1', role: 'assistant',
        content: 'Bu bir **örnek sohbet yanıtıdır**. Gerçek staj başvuru koşullarını doğrulamak için üniversitenin güncel staj yönergesine ve yetkili birimine başvurmalısın. Henüz canlı mevzuat araması bağlı değil.',
        answerStatus: 'insufficient', sources: [], feedback: null, reportStatus: null, createdAt: now,
      },
    ],
  },
  {
    id: 'demo-sinav',
    title: 'Sınav yönetmeliği',
    category: 'Dersler ve Sınavlar',
    createdAt: '2026-10-07T09:00:00.000Z',
    updatedAt: '2026-10-07T09:00:00.000Z',
    messages: [
      { id: 'demo-q2', role: 'user', content: 'Mazeret sınavı için hangi belgeler gerekir?', createdAt: '2026-10-07T09:00:00.000Z' },
      {
        id: 'demo-a2', role: 'assistant',
        content: 'Bu soruyu cevaplamak için doğrulanmış mevzuat kaynağı bulunmuyor. **Demo modunda gerçek belge taraması yapılmaz.** İstersen soruyu incelenmek üzere bildirebilirsin.',
        answerStatus: 'unanswered', sources: [], feedback: null, reportStatus: null, createdAt: '2026-10-07T09:00:00.000Z',
      },
    ],
  },
]

export const demoAnnouncements = [
  { id: 'preview-1', title: 'Duyurular alanı hazır', date: '2026-10-09', description: 'Bu bir tasarım önizlemesidir; resmî üniversite duyurusu değildir.' },
  { id: 'preview-2', title: 'Belgeler yakında bağlanacak', date: '2026-10-08', description: 'Django API tamamlandığında güncel duyurular burada görünecek.' },
]
