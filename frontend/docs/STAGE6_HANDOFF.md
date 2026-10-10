# AlbaVerse — Aşama 6 / Admin Paneli Devir Notu

## Kapsam

- `/yonetim` — Admin Dashboard: kullanıcı, personel, belge/duyuru önerisi, soru kuyruğu sayıları.
- `/yonetim/kullanicilar` — Arama/rol filtresi, demo öğrenci/personel rol değiştirme. Admin rolüne yükseltme bu sayfada kapalıdır.
- `/yonetim/personel-basvurulari` — Bekleyen personel onayları, gerekçeli ret.
- `/yonetim/belge-onerileri` — Personel PDF metadata önerileri, onay/red ve gerekçe. Onay gerçek PDF dosyası üretmez.
- `/yonetim/belgeler` — Onaylı/demo belge metadata kayıtları; form üzerinden yeni kayıt, düzenleme ve arşivleme. PDF bytes tutulmaz.
- `/yonetim/duyuru-onerileri` — Personel duyuru taslaklarından onaya gönderilen önerileri onaylama/red; onay demo duyurulara yansır.
- `/yonetim/duyurular` — Yayımlanan demo duyuruları inceleme, yeni oluşturma, düzenleme.
- `/yonetim/geri-bildirimler` — Örnek anonim soru kayıtları, durum güncelleme.
- `/yonetim/raporlar` — Yönetim ve genel sistem demo analizleri; farklı veri kümelerinin ayrımı açıkça gösterilir.

## Değişen / Yeni Dosyalar

- `src/components/admin/AdminShared.jsx` — Admin sekmeleri, demo uyarısı, onay/red modalı, badge, yardımcı bileşenler.
- `src/pages/admin/*.jsx` — Dokuz admin ekranı (yedi bileşen; öneriler için ortak sayfa).
- `src/mocks/adminMock.js` — Yetki kontrolü ve ortak sessionStorage tabanlı admin demo işlemleri.
- `src/mocks/staffMock.js` — Aynı demo kuyruğunu başlangıçta okumak için yardımcı export.
- `src/mocks/stage4Mock.js` — Onaylı demo duyuru ve belge metadata listelerinin kullanıcı ekranlarına yansıtılması.
- `src/services/api/adminApi.js` — Doğrulanmamış Django taslak endpointlerinin merkezi adaptörü.
- `src/services/index.js`, `src/services/api/index.js`, `src/mocks/index.js`, `src/app/AppRoutes.jsx` — Servis ve route kayıtları.
- `docs/API_CONTRACT_DRAFT.md`, `README.md`, `docs/STAGE6_HANDOFF.md`.

## Test Notları

- TypeScript parser ile 140+ JS/JSX kaynağı sözdizimi ve yerel alias importları kontrol edildi.
- Node smoke testiyle öğrenci ve personelin admin API erişiminin reddedilmesi; admin onay akışları; onaylı içeriğin kullanıcı listesine yansıması; personel öneri durumlarının güncellenmesi; belge arşivlenmesi sınandı.
- `npm ci --offline` kurulumu ortam önbelleğinde eksik paket olduğu için **başarısız**. Bu nedenle gerçek Vite build, Vitest ve Chrome ekran testi bu ortamda doğrulanamadı. Kullanıcının Windows bilgisayarında `npm install`, `npm run build:demo`, `npm test`, `npm run lint`, `npm run dev` komutları çalıştırılmalı.
- Django tarafındaki uç noktalar yokken gerçek modda başarılı ağ isteği varsayılmamalı.

## Özellikle test edilmesi gereken akış

1. Demo personel hesabıyla (`zeynep.arslan@ostimteknik.edu.tr`) PDF önerisi ve duyuru önerisi gönder.
2. Sayfadan çıkış yapıp aynı sekmede demo admin hesabıyla (`murat.sahin@ostimteknik.edu.tr`) giriş yap.
3. Yönetim Paneli > Belge Önerileri ve Duyuru Önerileri: öneriler görünmeli; karar verebilmelisin.
4. Onaylanan duyuru normal `Duyurular` sayfasına yansımalı. Belge önerisi yalnızca metadata listesine eklenmeli, PDF linki olmamalı.
5. Personel hesabına tekrar dön ve öneri durumunun `Onaylandı` olarak değiştiğini gör.
6. Onay bekleyen demo personel hesabı `mehmet.demir@ostimteknik.edu.tr` için başvuruyu admin hesabından onayla; tekrar girişte personel yetkisi etkinleşmeli.
7. Admin olmayan kullanıcı `/yonetim` adresine girememeli.

**Kapsam dışı ve backend'e bağlı:** PDF dosyası saklama/işleme, resmî duyuru yayını, gerçek personel onayı ve güvenliği, ayrı cihazlar arasında kayıt senkronizasyonu, admin işlem günlüğü, gerçek istatistiklerin hesaplanması. Aşama 7'de gerçek Django API sözleşmesi netleştirilmeli.
