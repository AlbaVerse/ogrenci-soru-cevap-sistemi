# AlbaVerse — Aşama 3 Teslim Notları

## Durum

Aşama 2 ZIP dosyası temel alınarak **Aşama 3 (ana sayfa ve sohbet)** eklendi. Önceki giriş, kayıt, rol, tema, sidebar ve placeholder Aşama 4–6 sayfaları korunmuştur.

## Geliştirilen işlevler

- `Ana Sayfa`: karşılamada kullanıcı adı, soru gönderme, kategori/örnek soru kartları, son sohbetler, kişisel demo kullanım özeti ve açıkça demo olduğu belirtilmiş duyuru önizlemeleri.
- `Yeni Sohbet / Sohbet`: ChatGPT tarzı mesaj akışı; Enter gönder, Shift+Enter yeni satır, beklerken gönderme engeli, otomatik aşağı kaydırma (yalnızca kullanıcı zaten sondaysa), yükleme göstergesi ve hata alanı.
- Yanıtlarda PDF kaynak adı, varsa sayfa/madde ve **gerçek URL mevcutsa** bağlantı gösterimi; olmayan kaynak uydurulmaz.
- Kopyalama, faydalı/faydasız değerlendirmesi, son yanıtı yeniden oluşturma, soru düzenleme (düzenlenen sorudan sonraki mesajlar geçersizleştiği için silinir), cevapsız/yetersiz soruyu incelemeye gönderme.
- `Sohbet Geçmişi`: sohbetleri görüntüleme, arama, yeniden adlandırma, silme ve tekrar açma.
- Mock modunda sohbetler oturum açan kullanıcı **ID**'sine göre `sessionStorage` içerisinde ayrılır. Tamamen demo verisidir; kalıcı bir sunucu kaydı değildir.
- Mock cevaplar resmî mevzuat hükmü içermez; kaynak gösteremez ve `answered` diye işaretlenmez. Yanıtlar `insufficient` veya `unanswered` olur.

## Önemli dosyalar

- `src/pages/student/HomePage.jsx`
- `src/pages/chat/ChatPage.jsx`, `HistoryPage.jsx`
- `src/components/chat/{ChatComposer,ChatMessage,ChatSuggestions,SourceCards}.jsx`
- `src/mocks/{chatMock,data/chatSeed}.js`
- `src/services/api/chatApi.js`
- `src/services/adapters/chatMapper.js`
- `src/app/AppRoutes.jsx`, `src/services/index.js`, `src/mocks/index.js`, `src/services/api/index.js`

## Backend sözleşmesi (taslak)

Bkz. `docs/API_CONTRACT_DRAFT.md` Aşama 3 eki. Gerçek Django API isimleri ve yanıt şemaları henüz doğrulanmadı. Özellikle **mesaj düzenle + yeniden cevap oluştur** işleminin atomik davranışı backend ile birlikte netleştirilmelidir.

## Kurulum / Doğrulama

```sh
npm install
npm run dev
npm run build:demo
npm test
npm run lint
```

Varsayılan geliştirme modu `mock`'tur. `.env.production` ise `api` olduğu için `npm run build` çıktısı gerçek endpointleri bekler (hazır değilse ağ hatası gösterebilir).

**Test kısıtı:** Bu geliştirme ortamında npm paketleri ağ erişimi (`EAI_AGAIN`) nedeniyle indirilemedi; Vite build, Vitest ve oxlint başarıyla çalıştırılmış değildir. JavaScript/JSX dosyaları TypeScript parser ile sözdizimsel olarak kontrol edilmiştir. Ayrıca Node tabanlı bağımsız smoke testinde mock sohbet işlemleri (oluşturma, gönderme, okuma, düzenleme, yeniden oluşturma, geri bildirim, bildirim, kullanıcı ayrımı, yeniden adlandırma ve silme) doğrulanmıştır; bu React/Vite derlemesinin yerine geçmez. Yerel bilgisayarda yukarıdaki komutları çalıştırıp doğrulayın.

## Sonraki aşama

Aşama 4: Genel/Kişisel İstatistikler, SSS, Belgeler, Kullanım Rehberi, Duyurular. Aşama 3'teki home özet servisi bu sayfalara bağlanmak için yeniden kullanılabilir.
