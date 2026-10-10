import { authMock } from './authMock'
import { chatMock } from './chatMock'
import { delay } from './storage'
import { mockStorage } from './storage'
import { AppError } from '@/services/adapters/AppError'

// Every fixture below is illustrative, NOT an official OSTİM Teknik Üniversitesi record.
// No nonexistent PDF files are presented as real links.
const DOCUMENTS = [
  { id: 'ornek-staj', title: 'Örnek: Staj yönergesi', category: 'Staj İşlemleri', documentDate: '2026-09-20', description: 'Staj prosedürlerine ilişkin olası belge kaydı. Resmî veya doğrulanmış PDF değildir.', status: 'demo', fileUrl: null },
  { id: 'ornek-sinav', title: 'Örnek: Sınav uygulama esasları', category: 'Dersler ve Sınavlar', documentDate: '2026-09-15', description: 'Sınavlara ilişkin örnek kayıt. Kesin koşullar için güncel resmî kaynakları kontrol et.', status: 'demo', fileUrl: null },
  { id: 'ornek-kayit', title: 'Örnek: Ders kayıt kılavuzu', category: 'Öğrenci İşleri', documentDate: '2026-08-19', description: 'Ders kayıtları için temsili belge kaydı; indirilebilir dosya sağlanmamıştır.', status: 'demo', fileUrl: null },
  { id: 'ornek-burs', title: 'Örnek: Burs ve destek esasları', category: 'Burslar', documentDate: '2026-09-04', description: 'Yalnızca liste arayüzünü test etmek için oluşturulmuş örnek kayıt.', status: 'demo', fileUrl: null },
  { id: 'ornek-disiplin', title: 'Örnek: Öğrenci disiplin mevzuatı', category: 'Yönetmelikler', documentDate: '2026-07-22', description: 'Gerçek resmî mevzuat metni değildir; belge entegrasyonu beklenmektedir.', status: 'demo', fileUrl: null },
  { id: 'ornek-mezuniyet', title: 'Örnek: Mezuniyet işlemleri rehberi', category: 'Öğrenci İşleri', documentDate: '2026-06-16', description: 'Mezuniyet işlemleri için temsili kayıt; belge bağlantısı mevcut değil.', status: 'demo', fileUrl: null },
]

const ANNOUNCEMENTS = [
  { id: 'demo-duyuru-1', title: 'AlbaVerse demo ortamına hoş geldin', category: 'Sistem', publishedAt: '2026-10-09T09:00:00Z', summary: 'Bu duyuru yalnızca AlbaVerse arayüzünü test etmek için hazırlanmıştır.', content: 'Bu ekranın içeriği örnek verilerden oluşur. Üniversitenin gerçek duyuruları Django API bağlandığında listelenecektir.', status: 'published', isDemo: true },
  { id: 'demo-duyuru-2', title: 'Belge görüntüleme önizlemesi', category: 'Sistem', publishedAt: '2026-10-08T13:30:00Z', summary: 'PDF bağlantıları yalnızca gerçek belgeler sağlandığında etkin olacak.', content: 'Mevzuat ve Belgeler ekranında listelenen örnek kayıtlar resmî belge değildir. Doğrulanmamış dosyalara bağlantı verilmez.', status: 'published', isDemo: true },
  { id: 'demo-duyuru-3', title: 'Sohbet geçmişi kullanım ipucu', category: 'Rehber', publishedAt: '2026-10-07T10:00:00Z', summary: 'Sohbetlerini bulmak için geçmiş ekranındaki arama alanını kullan.', content: 'Kişisel demo sohbetlerin yalnızca tarayıcıdaki demo oturumunda saklanır. Gerçek kullanıcı verileri için Django backend gereklidir.', status: 'published', isDemo: true },
]

const FAQ = [
  { id: 'faq-1', category: 'AlbaVerse', title: 'AlbaVerse nedir?', content: 'Üniversite mevzuatına dayalı soru-cevap deneyimi sunmayı amaçlayan dijital asistandır. Demo sürümünde gerçek belge araması yapılmaz.' },
  { id: 'faq-2', category: 'Sohbet', title: 'Nasıl soru sorabilirim?', content: 'Ana sayfadaki soru kutusundan veya Yeni Sohbet sayfasından soru yazıp Enter ile gönderebilirsin. Shift+Enter alt satıra geçer.' },
  { id: 'faq-3', category: 'Sohbet', title: 'Eski sohbetlerimi nerede bulurum?', content: 'Sohbet Geçmişi bölümünde konuşmalarını arayabilir, açabilir, yeniden adlandırabilir veya silebilirsin.' },
  { id: 'faq-4', category: 'Kaynaklar', title: 'PDF kaynaklarını nasıl görebilirim?', content: 'Yanıtın altında yalnızca sunucudan sağlanan doğrulanabilir kaynaklar listelenir. Sayfa/madde bilgisi yoksa gösterilmez.' },
  { id: 'faq-5', category: 'Kaynaklar', title: 'Staj veya sınav koşulları kesin olarak doğru mu?', content: 'Koşullar güncel mevzuata bağlıdır. Demo yanıtları resmî bilgi değildir; doğrulama için yetkili birimlerin güncel belgelerini incelemelisin.' },
  { id: 'faq-6', category: 'Geri Bildirim', title: 'Yanıt bulunamazsa ne yapmalıyım?', content: 'Sohbette “İncelemeye gönder” seçeneğini kullanabilirsin. Demo modunda bildirimin gerçek üniversite birimine iletilmez.' },
  { id: 'faq-7', category: 'Hesap', title: 'Kişisel istatistiklerimi kimler görebilir?', content: 'Kişisel İstatistikler sayfası yalnızca oturum sahibine ait verileri göstermeyi hedefler. Gerçek sunucuda erişim kontrolü backend tarafından uygulanmalıdır.' },
  { id: 'faq-8', category: 'Belgeler', title: 'Belge yükleyebilir miyim?', content: 'Öğrenciler ilk sürümde sohbete dosya yükleyemez. Yetkili personel için belge önerisi işlemleri yönetim panelinde geliştirilecektir.' },
]

const GENERAL_DEMO = {
  totalQuestions: 248, answeredCount: 164, unansweredCount: 49, insufficientCount: 35,
  averageResponseTimeMs: 2350,
  categories: [ { name: 'Dersler ve Sınavlar', count: 82 }, { name: 'Staj İşlemleri', count: 62 }, { name: 'Öğrenci İşleri', count: 48 }, { name: 'Burslar', count: 34 }, { name: 'Yönetmelikler', count: 22 } ],
  dailyTrend: Array.from({ length: 63 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 7, 8 + i)).toISOString().slice(0, 10),
    count: [3, 4, 4, 5, 2, 3, 6][i % 7] + (i < 5 ? 1 : 0),
  })),
  isDemo: true,
}

const clone = (item) => structuredClone(item)
// Admin'in demo onayı, gerçek PDF/veritabanı yayını değildir; yalnızca örnek içerik listesine yansır.
const demoPublished = () => mockStorage.read('admin.published.v1') || { documents: [], announcements: [] }

const errorNotFound = () => { throw new AppError({ status: 404, code: 'not_found', message: 'Kayıt bulunamadı.' }) }
const isWithin = (date, period) => {
  if (period === 'all') return true
  const parsed = Date.parse(date)
  return Number.isFinite(parsed) && Date.now() - parsed <= Number(period) * 86400000 && parsed <= Date.now()
}

export const statsMock = {
  async getGeneralStats() { await delay(); return clone(GENERAL_DEMO) },
  async getMyStats(period = 'all') {
    const user = await authMock.getSession()
    if (!user?.id) throw new AppError({ status: 401, code: 'unauthenticated', message: 'Oturum açmalısın.' })
    const items = await chatMock.listConversations()
    const chats = await Promise.all(items.map((item) => chatMock.getConversation(item.id)))
    const records = chats.flatMap((chat) => {
      const list = chat.messages || []
      return list.filter((m) => m.role === 'user' && isWithin(m.createdAt || chat.updatedAt, period)).map((question) => {
        const position = list.findIndex((entry) => entry.id === question.id)
        const reply = list.slice(position + 1).find((entry) => entry.role === 'assistant')
        return { id: question.id, title: question.content, date: question.createdAt || chat.updatedAt, category: chat.category || 'Diğer', status: reply?.answerStatus || 'unanswered', responseTimeMs: reply?.responseTimeMs ?? null, conversationId: chat.id }
      })
    })
    const categories = Object.entries(records.reduce((acc, x) => ({ ...acc, [x.category]: (acc[x.category] || 0) + 1 }), {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    const trendMap = records.reduce((acc, item) => { const key = item.date.slice(0, 10); acc[key] = (acc[key] || 0) + 1; return acc }, {})
    const dailyTrend = Object.entries(trendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
    const responseTimes = records.map((x) => x.responseTimeMs).filter((ms) => Number.isFinite(ms) && ms >= 0)
    return {
      totalQuestions: records.length,
      answeredCount: records.filter((x) => x.status === 'answered').length,
      unansweredCount: records.filter((x) => x.status === 'unanswered').length,
      insufficientCount: records.filter((x) => x.status === 'insufficient').length,
      averageResponseTimeMs: responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null,
      categories, dailyTrend, recentQuestions: records.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8), isDemo: true,
    }
  },
}
export const documentsMock = {
  async getDocuments() { await delay(); return clone([...demoPublished().documents.filter(x => x.status !== 'archived'), ...DOCUMENTS]) },
  async getDocumentById(id) { await delay(); return clone([...demoPublished().documents, ...DOCUMENTS].find((x) => x.id === String(id) && x.status !== 'archived') || errorNotFound()) },
}
export const faqMock = { async getFaqs() { await delay(); return clone(FAQ) } }
export const announcementsMock = {
  async getPublishedAnnouncements() { await delay(); return clone([...demoPublished().announcements,...ANNOUNCEMENTS].filter((x) => x.status === 'published')) },
  async getAnnouncementById(id) { await delay(); return clone([...demoPublished().announcements,...ANNOUNCEMENTS].find((x) => x.id === String(id) && x.status === 'published') || errorNotFound()) },
}
