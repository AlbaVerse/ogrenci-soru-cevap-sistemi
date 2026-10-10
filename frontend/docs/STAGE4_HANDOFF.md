# AlbaVerse — Aşama 4 Teslim Notları

## Kapsam

Aşama 3'ün mevcut auth, sohbet, karşılama, sidebar, tema ve yönetim placeholder yapısı korunmuştur.

Yeni sayfalar:

- `/istatistikler/genel`: anonim, toplu genel kullanım istatistikleri
- `/istatistikler/kisisel`: yalnızca oturum sahibinin soru geçmişinden hesaplanan kişisel özet, zaman filtresi, soru bağlantıları
- `/belgeler` ve `/belgeler/:id`: belge arama, kategori filtreleme, detay, yalnızca geçerli PDF URL'si varsa açma
- `/sss`: konu filtresi, arama, açılır soru cevaplar
- `/rehber`: uygulama kullanım yönergeleri ve ekran bağlantıları
- `/duyurular` ve `/duyurular/:id`: yalnızca yayımlanmış duyuru listesi, filtre, detay

Paylaşılan bileşenler: `src/components/stage4/` — istatistik kartları, grafikler, demo uyarısı, veri yükleme/hata durumları.

## Demo / API

Yeni servisler `src/services` üzerinden erişilir:
- `statsService.getGeneralStats()`
- `statsService.getMyStats(period)` (`7`, `30`, `all`)
- `documentsService.getDocuments()` / `getDocumentById(id)`
- `faqService.getFaqs()`
- `announcementsService.getPublishedAnnouncements()` / `getAnnouncementById(id)`

Mock: `src/mocks/stage4Mock.js`. API: `src/services/api/stage4Api.js`; DTO dönüştürme: `src/services/adapters/stage4Mapper.js`.

- Genel istatistik fixture'ları temsili ve hayalîdir. Kullanıcıları temsil ETMEZ.
- Kişisel istatistikler aktif demo hesabının sohbet geçmişine göre hesaplanır. `answered`, `unanswered`, `insufficient` durumları ayrıdır.
- Demo belgelerin gerçek dosya bağlantısı YOKTUR. Uydurma PDF oluşturulmaz.
- Demo duyurular resmi duyuru değildir.
- SSS'deki akademik konularda resmî mevzuat hükümleri uydurulmamıştır.
- Gerçek modda API endpointleri henüz doğrulanmadığı için yalnızca backend sözleşmesi onaylandıktan sonra etkinleştirin.

## API ekleri (TASLAK)

| GET | Yanıtın ana alanları |
|---|---|
| `/stats/general/` | total_questions, answered_count, unanswered_count, insufficient_count, average_response_time_ms, category_breakdown[], daily_trend[] |
| `/stats/me/?period=7|30|all` | yukarıdakiler + recent_questions[]; filtre mutlaka server-side login sahibine uygulanmalı |
| `/documents/` | items[]: id, title, category, document_date, description, status, file_url |
| `/documents/:id/` | tek document nesnesi |
| `/faqs/` | items[]: id, category, question, answer |
| `/announcements/` | yalnızca published, items[]: id, title, summary, content, category, published_at, status |
| `/announcements/:id/` | tek duyuru nesnesi, server-side publish kontrolü |

Zaman grafiği, `daily_trend[]` verilerinden haftalık/aylık gruplandırma yapar; gerçek backend zamana yayılan seriyi sağlayabilmelidir. Cevaplanma oranı = `answered_count / total_questions`; AI tarafından cevap verilmesi cevabın doğruluğunun garantisi değildir.

PDF URL erişimi Django auth/permission ile korunmalı; frontend görsel kontrol güvenlik mekanizması değildir.

## Test ve çalıştırma

```sh
npm install
npm run build:demo
npm test
npm run lint
npm run dev
```

**Bu teslimde npm paketlerini çalışma ortamında indirip Vite build/test çalıştırmak mümkün olmadı.** Dosyaların sözdizimi ve import bağlantıları yerel ayrıştırma ile kontrol edilmiştir; doğrulamanın kullanıcı bilgisayarında tamamlanması gerekir. 

## Sonraki aşama

Aşama 5: Personel dashboard, cevaplanamayan soru değerlendirme, PDF belge önerileri ve admin onay süreci, duyuru önerisi, personel istatistikleri. Yönetim API'leri henüz gerçek olarak bağlı değil.
