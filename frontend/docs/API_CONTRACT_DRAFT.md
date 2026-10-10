# AlbaVerse API Sözleşmesi (TASLAK)

> Bu belge frontend'in varsayımlarını listeler ve backend ekibinin onayına sunulur.
> Burada yazan hiçbir endpoint doğrulanmış veya çalışan bir API olarak kabul edilmemelidir.
> Belge aşama aşama genişletilecektir (Aşama 7'de tamamlanır).

## Genel kurallar

- Ön ek: `/api/v1/` (frontend `VITE_API_BASE_URL` ile ayarlar).
- Kimlik doğrulama: Django HttpOnly session çerezi. Frontend `credentials: "include"` kullanır.
- CSRF: Güvenli olmayan isteklerde `csrftoken` çerezi okunur ve `X-CSRFToken` başlığı gönderilir.
  **Backend ile netleşecek:** token'ın nasıl alınacağı, `SameSite`, `CSRF_TRUSTED_ORIGINS`, CORS.
- Tarihler ISO 8601.
- Hata gövdesi: `{ "error": { "code": "string", "message": "string", "fields": { "alan": ["mesaj"] } } }`
  (`fields` isteğe bağlı). Frontend 401/403/404/409/422/500 için varsayılan Türkçe mesaj üretir.
- Sayfalama (öneri): `{ "items": [...], "pagination": { "page", "page_size", "total" } }`.

## Kimlik doğrulama uçları (Aşama 1-2)

### `GET /auth/me/`

Oturum bilgisi. Frontend hem **401** hem **403** yanıtını "oturum yok" sayar (DRF `SessionAuthentication` girişsiz isteğe 403 döndürebilir).

Yanıt (kullanıcı nesnesi doğrudan veya `{ "user": {...} }` içinde):

```json
{
  "id": 1,
  "first_name": "İrem",
  "last_name": "Kaya",
  "email": "irem.kaya@ostimteknik.edu.tr",
  "role": "student",
  "requested_role": "staff",
  "staff_approval_status": "pending",
  "email_verified": true,
  "created_at": "2026-02-12T09:30:00Z"
}
```

- `role`: `student` | `staff` | `admin`. Tanınmayan değer frontend'de `student` kabul edilir.
- `staff_approval_status`: `null` | `pending` | `approved` | `rejected`.

### `POST /auth/logout/`

Oturumu sonlandırır. Yanıt gövdesi beklenmez (`204` önerilir).

### `POST /auth/login/`

İstek: `{ "email", "password" }`. Başarılıysa oturum çerezi kurulur ve yanıt `/auth/me/` ile aynı kullanıcı nesnesidir.

| Durum | `error.code` | Frontend davranışı |
|---|---|---|
| 401 | `invalid_credentials` | "E-posta veya şifre hatalı." (hesap varlığı ayırt edilmemeli) |
| 403 | `email_not_verified` | Doğrulama sayfasına yönlendirir |
| 422 | `validation_error` | `error.fields` alan altında gösterilir |

Doğrulanmamış hesap **oturum açamaz** (frontend bunu varsayar).

### `POST /auth/register/`

İstek:

```json
{ "first_name": "Ali", "last_name": "Veli", "email": "ali.veli@ostimteknik.edu.tr",
  "password": "...", "requested_role": "student" }
```

- `requested_role`: yalnızca `student` | `staff`. **Sunucu `admin` değerini asla kabul etmemeli.**
- `staff` istenirse hesap `role=student`, `requested_role=staff`, `staff_approval_status=pending` olur.
  Onay süreci e-posta doğrulamadan sonra admine düşer.
- `@ostimteknik.edu.tr` kuralı sunucuda da zorunlu (frontend kuralı yalnızca hızlı geri bildirimdir).
- 409 (`email_taken`) ve 422 yanıtlarında `error.fields` kullanılır. Kayıt sonrası oturum açılmaz.

### `POST /auth/verify-email/`

İki yöntem de desteklenir; backend birini seçince diğeri kaldırılabilir:

- Bağlantı: `{ "token": "..." }` (e-posta bağlantısı `/e-posta-dogrulama?token=...` açar)
- Kod: `{ "email": "...", "code": "123456" }`

Geçersiz/süresi dolmuş için 400 veya 422. İşlem idempotent olmalı (tekrar açılan bağlantı hata vermemeli).

### `POST /auth/resend-verification/`

İstek: `{ "email" }`. Hesap varlığı sızdırılmamalı: her durumda aynı başarılı yanıt. Frontend 60 sn bekleme uygular; sunucu ayrıca hız sınırı (429) uygulamalı.

### `POST /auth/password-reset/` ve `POST /auth/password-reset/confirm/`

- İstek: `{ "email" }`. Her durumda aynı başarılı yanıt (hesap varlığı sızmaz).
- Onay: `{ "token", "password" }` (+ Django varsayılan akışı için isteğe bağlı `"uid"`). E-posta bağlantısı `/sifre-sifirla?token=...&uid=...` biçiminde beklenir.
- Geçersiz/süresi dolmuş token: 400. Zayıf şifre: 422 (`fields.password`).

### `PATCH /users/me/`

İstek: `{ "first_name", "last_name" }`. Yanıt güncel kullanıcı nesnesi. E-posta ve rol bu uçtan değiştirilemez.

### `POST /auth/password-change/` (ÖNERİ, taslakta yoktu)

İstek: `{ "current_password", "new_password" }`. Mevcut şifre hatalıysa 422 ve `fields.current_password`.

## Oturum süresi

Oturum açıkken korumalı bir istek **401** dönerse frontend oturumu düşürür ve "Oturum süren doldu" mesajıyla giriş sayfasına yönlendirir.
403 yetki hatası sayılır, oturum düşürülmez. (DRF `SessionAuthentication` girişsiz isteğe 403 döndürebilir; bu durumda
süre dolumu mesajı çıkmaz, yalnızca `/auth/me/` için 403 "oturum yok" sayılır.)

## Parola kuralı (öneri)

Frontend ipucu olarak en az 8 karakter, en az bir harf ve bir rakam gösterir. Asıl kural Django `AUTH_PASSWORD_VALIDATORS` ile sunucuda uygulanmalı;
sunucu hataları `error.fields.password` ile döndürülmeli.

---

## Aşama 3 — Sohbet ve ana sayfa API ek sözleşmesi (TASLAK)

> **Henüz Django ekibi tarafından onaylanmadı.** Aşağıdaki endpoint ve cevap biçimleri React adaptöründe beklenen taslaktır. Backend geliştirilene kadar `VITE_DATA_MODE=mock` kullanılmalıdır.

### `GET /conversations/?search=...`

Yanıt: `{ "items": [{"id":"15","title":"Staj hakkında","category":"Staj İşlemleri","created_at":"2026-10-09T10:00:00Z","updated_at":"2026-10-09T10:00:00Z","message_count":4}], "pagination": { ... } }`

Kullanıcı yalnızca **kendisine ait** sohbetleri görmelidir. Backend arama parametresinde başlık ve mesaj içeriğini arayabilir; kişisel veri sızdırmamalıdır.

### `POST /conversations/`

İstek: `{ "category": "Staj İşlemleri" }` (category opsiyonel). Yanıt: tam sohbet nesnesi; `messages: []`.

### `GET /conversations/{id}/`

Yanıt: `{ "id":"15", "title":"...", "category":null, "created_at":"...", "updated_at":"...", "messages": [ ... ] }`. Başka kullanıcının sohbetine erişimde 403/404.

### `PATCH /conversations/{id}/`, `DELETE /conversations/{id}/`

Başlık düzenleme isteği `{ "title": "Yeni başlık" }`, yanıt güncel sohbet nesnesi. Silme sonrası `204` önerilir.

### `POST /conversations/{id}/messages/`

İstek: `{ "content": "Staj başvurusu nasıl yapılır?" }`.

Yanıt (önerilen):

```json
{
  "conversation": {
    "id": "15", "title": "Staj başvurusu", "created_at": "2026-10-09T10:00:00Z",
    "updated_at": "2026-10-09T10:01:00Z", "messages": [
      {"id":"21", "role":"user", "content":"Staj başvurusu nasıl yapılır?", "created_at":"2026-10-09T10:00:00Z"},
      {"id":"22", "role":"assistant", "content":"...", "answer_status":"answered", "response_time_ms":1200,
       "feedback":null, "report_status":null, "created_at":"2026-10-09T10:01:00Z",
       "sources":[{"document_id":8,"title":"Staj Yönergesi","page":5,"article":"Madde 8","url":"/api/v1/documents/8/file/"}]}
    ]
  }
}
```

`answer_status` için öneri: `answered` / `insufficient` / `unanswered`. Kaynaklar, özellikle `page`, `article`, `url` yalnızca **sunucuda doğrulanan** verilerle doldurulur; alanlar opsiyoneldir.

Sohbet yanıtı streaming değildir. İstek bitene kadar yükleme göstergesi, bitince yanıtın tamamı gösterilir.

### `PATCH /messages/{id}/` — kullanıcı sorusunu düzenle

İstek: `{ "content": "Güncellenmiş soru", "conversation_id": "15", "regenerate": true, "truncate_following": true }`.

**Önemli sözleşme kararı:** Mevcut mock uygulamasında kullanıcı sorusu düzenlenince sonraki mesajlar kaldırılır, ilgili soruya yeni cevap üretilir ve **tam güncel sohbet** döndürülür. Backend ile tek işlemde/atomik olarak uygulanmalı; kısmi güncelleme yapılmamalı. Farklı davranış seçilecekse hem servis hem UI yeniden düzenlenmelidir.

### `POST /messages/{id}/regenerate/`

İstek: `{ "conversation_id": "15" }`. Yalnızca sohbetin **son assistant mesajı** için geçerli; yanıt **tam güncel sohbet**. Sonraki mesajları etkilememesi için eski yanıt yeni yanıtla yerinde değiştirilir.

### `POST /messages/{id}/feedback/`

İstek: `{ "conversation_id": "15", "rating": "positive" }`, ayrıca `"negative"` veya `null` (geri al). Yanıt güncel `assistant` mesaj nesnesi.

### `POST /question-reports/`

İstek: `{ "conversation_id": "15", "message_id": "22" }`. Yalnızca `unanswered` veya `insufficient` yanıtlarda. Yanıt güncel `assistant` mesaj nesnesi (`"report_status":"new"`). Aynı mesajı tekrar tekrar göndermeye backend engel olmalı.

### Ana sayfa veri özeti

Aşama 3 ana sayfa, taslak `GET /stats/me/` ve `GET /announcements/?limit=3` kaynaklarını kullanır. Backend hazır değilse API modunda uydurma veri dönmez, kartlar boş/hata durumunu gösterir. Demo modunda istatistikler mock sohbetlerden hesaplanır ve duyurular açıkça **örnek önizleme** olarak etiketlenir.

### Güvenlik ve veri erişimi

- Her endpointte sunucu oturumu doğrulanmalı; sohbet listesi ve ID erişimleri kullanıcıya göre sınırlandırılmalı.
- Cevap kaynaklarının URL'leri yalnızca güvenilen ve erişimi kontrol edilen belge kaynaklarına yönlenmeli.
- Sohbet içerikleri için kaynak belge erişimi kimlik doğrulama/kullanıcı yetkilerine tabi olmalı.
- Frontend `HttpOnly` cookie ve CSRF önerisini korur; kesin uygulama Django ekibiyle doğrulanacak.
- Mock modundaki `sessionStorage` güvenli kişisel veri saklama mekanizması **değildir** ve sadece demo için kullanılır.

## Aşama 5 — Personel Paneli (TASLAK, backend ekibi tarafından onaylanmalı)

Bu sayfalarda yalnızca `staff` rolü (Django sunucusu tarafından da doğrulanmış) erişim sahibi olabilir. `student` ve onay bekleyen personel hesabı erişememelidir. React'daki `RoleRoute` sadece arayüz kısıtıdır. Gerçek backend her istekte yetki ve görev/kategori kapsamı kontrol etmelidir.

| Metot | Örnek endpoint | Amaç |
| --- | --- | --- |
| GET | `/staff/dashboard/` | Yetki kapsamındaki bekleyen sorular + kullanıcının öneri özetleri |
| GET | `/management/feedback/` | Personelin yetkili olduğu anonimleştirilmiş sorular |
| PATCH | `/management/feedback/{id}/` | Durum: `new`, `reviewing`, `resolved` |
| GET | `/document-proposals/` | Sadece oturum sahibinin önerileri |
| POST | `/document-proposals/` | `multipart/form-data` ile PDF + belge alanları |
| GET | `/announcement-proposals/` | Sadece oturum sahibinin duyuru önerileri |
| POST | `/announcement-proposals/` | Yeni taslak/onay bekleyen duyuru |
| PATCH | `/announcement-proposals/{id}/` | Yalnızca kendine ait taslağı düzenle/onaya gönder |
| GET | `/staff/stats/` | Personel görev alanıyla sınırlandırılmış istatistikler |

### Önerilen veri formatları

`POST /document-proposals/`: `proposal_type` (`new`/`update`), `document_id` (güncellemede zorunlu), `title`, `category`, `document_date` (YYYY-MM-DD), `description`, `file` (yeni belgede zorunlu, MIME `application/pdf`, öneri boyutu <=10 MB). Gerçek PDF içeriği Django tarafından saklanmalı, doğrulanmalı ve henüz yayımlanmış kabul edilmemelidir. Demo modunda dosya **gerçekten yüklenmez**; yalnızca dosya adı ve dosya boyutu gösterilir.

`POST /announcement-proposals/`: `{ "title": "...", "content": "...", "category": "Genel", "status": "draft"|"pending" }`. Personel admin onayı olmadan yayınlayamaz. Yalnızca kişinin taslağı `PATCH` ile değiştirilebilir.

`GET /staff/stats/` için önerilen alanlar: `assigned_questions`, `new_questions`, `reviewing_questions`, `resolved_questions`, `document_proposals`, `announcement_proposals`, `proposal_pending`, `categories: [{name,count}]`.

`GET /staff/dashboard/` için önerilen alanlar: `pending_questions`, `pending_document_proposals`, `pending_announcement_proposals`, `recent_questions`, `recent_proposals`. `recent_questions` nesneleri `id,question,category,status,answer_status,created_at`; öneriler `id,title,category,status,created_at,updated_at` gibi alanlar içerir.

**Not:** Alan adları, yetki kapsamı ve yanıt şekilleri öneridir. Django REST Framework kullanımı zorunlu değildir. Var olan API farklıysa `src/services/api/staffApi.js` güncellenmeli, ekran bileşenleri değiştirilmemelidir.

---

## AŞAMA 6 — Admin paneli sözleşme önerileri (DOĞRULANMAMIŞ)

> Bunlar henüz Django'da mevcut olduğu teyit edilmemiş REST yollarıdır. React `adminApi` adaptörü bu sözleşmeye göre hazırlanmıştır. Gerçek yollar, durum kodları, alanlar ve yetkilendirme backend ekibiyle birlikte kesinleştirilmelidir. Yalnızca **admin** rolündeki kullanıcı bu işlemlere erişebilir; frontend role guard gerçek güvenlik sağlamaz.

| HTTP | Yol | Amaç |
| --- | --- | --- |
| GET | `/admin/dashboard/` | Kullanıcı ve bekleyen yönetim işlemleri özeti |
| GET | `/admin/users/` | Kullanıcı listesi |
| PATCH | `/admin/users/{id}/` | Öğrenci/personel rolü güncelleme; admin yükseltmesi ayrı güvenli süreç |
| GET | `/admin/staff-requests/` | Personel yetkisi isteyen hesaplar |
| POST | `/admin/staff-requests/{id}/decision/` | `{status:"approved"|"rejected",reason:"..."}` |
| GET | `/admin/document-proposals/` | Personelin belge önerileri |
| POST | `/admin/document-proposals/{id}/decision/` | Belge önerisi onay/red |
| GET | `/admin/documents/` | Yönetilebilir mevzuat belgeleri |
| POST | `/admin/documents/` | PDF yükleme; multipart/form-data |
| PATCH | `/admin/documents/{id}/` | Başlık, kategori, tarih, açıklama değişikliği |
| POST | `/admin/documents/{id}/archive/` | Belge arşivleme |
| GET | `/admin/announcement-proposals/` | Duyuru önerileri |
| POST | `/admin/announcement-proposals/{id}/decision/` | Duyuru önerisini onaylama/reddetme |
| GET | `/admin/announcements/` | Yönetilen duyurular |
| POST | `/admin/announcements/` | Admin tarafından duyuru yayınlama |
| PATCH | `/admin/announcements/{id}/` | Duyuru düzenleme |
| GET | `/admin/feedback/` | Yetkili geri bildirim/soru inceleme kuyruğu |
| PATCH | `/admin/feedback/{id}/` | `{status:"new"|"reviewing"|"resolved"}` |
| GET | `/admin/reports/` | Yönetici metrikleri |

`GET /admin/dashboard/` için önerilen alanlar: `users`, `pending_staff`, `pending_documents`, `pending_announcements`, `pending_feedback`, `recent_documents`, `recent_announcements`. Bu sayfanın mock veri alanları camelCase; gerçek API için ayrıca response mapper gerekecektir.

`GET /admin/reports/` için önerilen alanlar: `total_users`, `students`, `staff`, `pending_staff`, `questions`, `unresolved_questions`, `documents`, `approved_documents`, `announcements`, `approved_announcements`, `categories:[{name,count}]`. Tarihler ISO 8601, ID türü string veya integer olabilir. Backend dönüştürücüsü kesinleşene kadar `adminApi` bu alanların çoğunu yalnızca iletmektedir; gerçek entegrasyondan önce camelCase normalizasyonunun tamamlanması şarttır.

**Onay süreçleri:** Öneri yalnızca `pending` durumundayken karara bağlanabilir. Rette 500 karaktere kadar zorunlu gerekçe olmalı. Admin `approved` dediğinde gerçek PDF dosyasının sunucuda bulunduğu veya yapay zekâ tarafından işlendiği varsayılmamalı; sunucu belge işleme durumunu ayrıca döndürmeli. Duyuru onayından sonra yayın görünürlüğü backend tarafından sağlanmalı.

**Demo paylaşımı:** Personel ve admin mock servisleri aynı `albaverse.mock.staff.management.v1` storage kaydını okur. Demo `published` listesi `albaverse.mock.admin.published.v1` anahtarındadır. Bunlar yalnızca aynı origin ve aynı browser-tab sessionStorage içinde paylaşılır. Gerçek kullanıcı/veri gizliliği sağlamaz, gerçek backend işlemleri değildir. Admin onaylı PDF tekliflerinin yalnızca metadata'sı listelenir; dosya baytları mevcut değildir, `fileUrl:null` olarak kalır. Admin onaylı duyuruların sadece demo içeriği kullanıcıların duyuru listesine eklenir.

**Güvenlik:** Rol değiştirme, personel onayı ve yayın kararı sunucuda `admin` izin kontrolüne tabi olmalı. Gerçek API'lerde CSRF, işlem logları, kimlik doğrulama, dosya taraması ve yükleme sınırı backend'de uygulanmalıdır. Kullanıcıların kişisel bilgilerini gelişi güzel raporlara veya ortak listelere taşımayın.
