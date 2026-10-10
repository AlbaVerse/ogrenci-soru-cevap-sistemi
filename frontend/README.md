# AlbaVerse Frontend

OSTİM Teknik Üniversitesi için yapay zekâ destekli mevzuat soru-cevap sistemi arayüzü.
React + Vite + Tailwind CSS. Django backend ile JSON API üzerinden konuşacak şekilde tasarlanmıştır.

> Durum: **Aşama 3 (ana sayfa ve sohbet)** geliştirildi. İstatistik, belge, duyuru, personel ve yönetim ekranları sonraki
> aşamalarda eklenecek. Henüz gerçek bir backend'e bağlı değildir.

## Gereksinimler

- Node.js 20.19+ veya 22+ (Vite 8)
- npm

## Kurulum ve çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (varsayılan mod: `mock`) |
| `npm run build` | Üretim derlemesi (`.env.production` → `api` modu, mock veri pakete girmez) |
| `npm run build:demo` | Demo derlemesi (`mock` modu) |
| `npm run preview` | Derlenmiş paketi yerelde açar |
| `npm test` | Testleri bir kez çalıştırır (`npm run test:watch`: izleme) |
| `npm run lint` | oxlint |

## Veri modu

`.env.example` dosyasını `.env` olarak kopyalayıp düzenleyebilirsin.

- `VITE_DATA_MODE=mock`: Demo verisiyle çalışır, sunucuya istek atmaz. Ekranın üstünde sürekli "Demo modu" bandı görünür.
- `VITE_DATA_MODE=api`: `VITE_API_BASE_URL` (varsayılan `/api/v1`) üzerinden Django'ya bağlanır.
  Geliştirmede Vite `/api` isteklerini `VITE_DEV_PROXY_TARGET` adresine yönlendirir.

Bileşenler yalnızca `src/services` içindeki servisleri çağırır; mock veya API seçimi tek noktada yapılır.

## Demo modunda neler denenebilir?

Demo hesapların hepsinin parolası `Demo1234!` (yalnızca geliştirme/test içindir; giriş sayfasında listelenir).

- Giriş, kayıt, e-posta doğrulama (kod `123456` veya demo bağlantısı), şifremi unuttum / sıfırla.
- Personel olarak kayıt: doğrulama sonrası hesap "onay bekliyor" durumunda öğrenci olarak çalışır.
- Üstteki banttan **rol önizleme** ve **oturum süresini doldur** (oturum sonu mesajını denemek için).
- `/profil`: ad güncelleme, tema tercihi, şifre değiştirme.
- `/tasarim-sistemi` (yalnızca `npm run dev`): bileşen ve tema önizlemesi.
- `/`: karşılama, soru alanı, kategoriler, son sohbetler, demo özet ve duyuru önizlemesi.
- `/sohbet` ve `/sohbet/:id`: demo soru-cevap, kaynak kartları, kopyalama, oy verme, yeniden oluşturma, düzenleme, bildirme.
- `/sohbet-gecmisi`: konuşmaları arama, yeniden adlandırma, silme ve açma.

Mock modunda kayıt olan hesapların parolası yalnızca bellekte tutulur; sayfayı yenilersen o hesapla giriş
yapamazsın (yeniden kayıt ol veya "Demo verisini sıfırla"). Bu yalnızca demo sınırlamasıdır.

## Klasör yapısı

```
src/
  app/          Router, route koruma bileşenleri, App
  config/       env, route yolları, menü, roller, hata mesajları
  context/      Tema, oturum, bildirim sağlayıcıları
  components/   ui/ (ortak bileşenler), layout/ (kabuk, sidebar, topbar)
  pages/        auth/, student/, staff/, admin/, shared/, dev/
  services/     index.js (mod seçimi), api/ (gerçek istekler), adapters/ (mapper, hata)
  mocks/        Demo veri ve servisler (yalnızca mock modunda pakete girer)
  styles/       tokens.css (renkler), index.css (Tailwind)
  test/         Test kurulum ve yardımcıları
docs/API_CONTRACT_DRAFT.md   Backend ekibine sunulacak taslak sözleşme
```

## Güvenlik notları

- Rol bazlı menü/sayfa gizleme yalnızca kullanıcı deneyimi içindir; yetkilendirme backend'de yapılmalıdır.
- Kimlik bilgisi (token/şifre) localStorage'a yazılmaz. Önerilen yöntem: HttpOnly session çerezi + CSRF.
- localStorage yalnızca tema ve kenar çubuğu tercihi için kullanılır.

## Aşama 3 notları

- Ayrıntılı devir notları: [`docs/STAGE3_HANDOFF.md`](docs/STAGE3_HANDOFF.md).
- Demo sohbetler kullanıcı bazında `sessionStorage` içinde tutulur; gerçek Django veya SQLite kaydı **değildir**.
- Demo cevaplar resmî mevzuat bilgisi içermez ve gerçek PDF kaynağı uydurulmaz.
- Üretim modunda (API) taslak Django sohbet endpointleri hazır olmadan ilgili işlemler çalışmayacaktır.

## Aşama 4 — İstatistikler ve bilgi sayfaları

Genel/Kişisel İstatistikler, Mevzuat ve Belgeler, Sık Sorulan Sorular,
Kullanım Rehberi ve Duyurular ekranları eklendi. Ayrıntılı teknik notlar ve
**backend ekibinin onaylayacağı TASLAK endpoint sözleşmesi** için
`docs/STAGE4_HANDOFF.md` dosyasına bakın.

Örnek genel istatistikler gerçek üniversite verileri değildir; kişisel demo
istatistikleri ise açık demo hesabının sohbetlerinden hesaplanır. Örnek PDF
kayıtlarında gerçek dosya bulunmadığı için PDF açma bağlantıları kapalıdır.


## Aşama 5 — Personel Paneli

Personel demo hesabıyla giriş yapıp sol menüden **Yönetim Paneli**'ni aç. Burada görev özeti, anonim demo soru inceleme, belge/PDF önerileri, duyuru taslakları ve personel istatistikleri yer alır. Yeni belge önerisi bir PDF seçimini kontrol eder, ancak **demo modunda dosya içeriği kaydedilmez veya hiçbir sunucuya yüklenmez**. Duyuru/öneri durumu `pending` iken gerçek yayın yapılmaz. Ayrıntılar için `docs/STAGE5_HANDOFF.md` ve backend ekibinin onayını bekleyen `docs/API_CONTRACT_DRAFT.md` dosyalarına bak.

## Aşama 6 — Yönetici Paneli (demo)

Yönetici hesabı ile (`murat.sahin@ostimteknik.edu.tr`, demo parolası `Demo1234!`) giriş yaptıktan sonra **Yönetim Paneli** menüsünden kullanıcılar, personel onayları, belge/duyuru önerileri, geri bildirimler ve detaylı raporlar görüntülenebilir.

Personel önerileri Aşama 5 ile aynı tarayıcı sekmesindeki demo kayıtlarını kullanır. Onaylanan duyurular demo duyuru sayfasına; belge önerileri ise PDF olmadan metadata listesine yansır. Gerçek Django onayları, PDF yüklemeleri veya kullanıcı yetki değişiklikleri gerçekleşmez. Açık birden fazla bağımsız sekme/cihaz arasında demo verilerin eşzamanlanması garanti edilmez.

Devir notu: `docs/STAGE6_HANDOFF.md`. Django taslak endpointleri: `docs/API_CONTRACT_DRAFT.md`.

Kontrol komutları: `npm install`, `npm run build:demo`, `npm test`, `npm run lint`, `npm run dev`. Bu sürüm için yerel Windows bilgisayarında gerçek build ve tarayıcı testi yapılması gerekir.
