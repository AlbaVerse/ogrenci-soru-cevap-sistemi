# AlbaVerse — Aşama 5 Devir Notları

## Kapsam

Aşama 4 sürümü korunarak personel için aşağıdaki route ekranları eklendi:

- `/personel`: Personel özeti, bekleyen görevler, yeni önerilere kısayollar
- `/personel/sorular`: Personel kapsamındaki anonim demo soruları arama/filtreleme ve durum güncelleme
- `/personel/belge-onerileri`: Personelin kendi belge önerileri ve onay durumları
- `/personel/belge-onerileri/yeni`: Yeni PDF veya mevcut belgeye değişiklik önerisi
- `/personel/duyuru-onerileri`: Kendi duyuru taslakları/onay durumları
- `/personel/duyuru-onerileri/yeni`: Duyuru taslağı ve onay gönderme (taslak düzenleme `?edit=id`)
- `/personel/istatistikler`: Göreve özgü soru inceleme ve öneri istatistikleri

Bu sayfalar `RoleRoute allow=['staff']` altında olduğundan `student`, `admin` ve onay bekleyen personel bu ekranlara erişemez. Admin'in ayrı yönetim ekranları Aşama 6'da hazırlanacaktır.

## Demo ve gerçek API ayrımı

- `src/mocks/staffMock.js`: Tarayıcının `sessionStorage` içinde yaşayan **örnek** görevler ve öneri metadatası. Kullanıcı adı/e-posta içeren gerçek soru kullanılmaz. Belge/duyuru önerileri `createdBy` ile filtrelenir. Sayfa yenilenince aynı sekmede veriler korunur.
- **PDF gerçekten yüklenmez, sunucuda depolanmaz.** Demo modunda yalnızca dosya adı ve boyutu saklanır. Dosya en fazla 10 MB ve `.pdf` olmalıdır. Bu durum arayüzde açıklanır.
- Personelin durum değişikliği gerçek üniversite birimine iletilmez.
- `src/services/api/staffApi.js`: İleriye dönük Django istekleri. Endpointler ve response mapperları **onaylanmamış taslaktır**. Gerçek API hazırlanıp doğrulanmadan `VITE_DATA_MODE=api` kullanmayın.
- `docs/API_CONTRACT_DRAFT.md` ek Aşama 5 sözleşmesini içerir. Gerçek Django endpointleri ve yetkilendirme sistemi backend ekibiyle birlikte tamamlanmalıdır.

## Değişen başlıca dosyalar

- `src/app/AppRoutes.jsx` — placeholder ekranlar gerçek personel bileşenleriyle değiştirildi.
- `src/pages/staff/` — yedi route için personel bileşenleri.
- `src/components/staff/StaffShared.jsx` — sekme menüsü, durum etiketleri, sayısal kartlar.
- `src/mocks/staffMock.js` ve `staffMock.test.js`.
- `src/services/api/staffApi.js`.
- `src/mocks/index.js`, `src/services/api/index.js`, `src/services/index.js` — servis dışa aktarma.
- `docs/API_CONTRACT_DRAFT.md` — personel API taslağı.

## Sonraki aşamaya notlar

Aşama 6'da admin ekranları yapılırken aynı belge ve duyuru önerisi verilerini paylaşan demo deposu kullanılabilir; yönetici onay/red işlemleri yetkilendirilerek eklenmelidir. Onay kararı gerçek modda backend'den gelmelidir. Personel, önerilerini kendisi yayımlayamaz.

## Bilgisayarda test

```powershell
npm install
npm run build:demo
npm test
npm run lint
npm run dev
```

Giriş ekranındaki **Personel** demo hesabıyla giriş yapıp sol menüde **Yönetim Paneli**'ne tıklayın. Öğrenci veya onay bekleyen personel hesabı bu paneli açmamalı. Uygulama `node_modules` dahil edilmeden paketlendi. Bu teslim ortamında npm paket kurulumu offline cache eksikliği nedeniyle tamamlanamadı, dolayısıyla Vite build/Vitest/Lint burada çalıştırılamadı. Bunları yerel Node.js 24 bilgisayarında doğrula.
