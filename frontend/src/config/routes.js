// Tüm yollar tek yerde. Yol adlarını değiştirmek için yalnızca bu dosya düzenlenir.
export const ROUTES = Object.freeze({
  login: '/giris',
  register: '/kayit',
  verifyEmail: '/e-posta-dogrulama',
  verifyPending: '/e-posta-dogrulama-bekleniyor',
  forgotPassword: '/sifremi-unuttum',
  resetPassword: '/sifre-sifirla',

  home: '/',
  chatNew: '/sohbet',
  chatPattern: '/sohbet/:id',
  chat: (id) => `/sohbet/${id}`,
  history: '/sohbet-gecmisi',
  statsGeneral: '/istatistikler/genel',
  statsPersonal: '/istatistikler/kisisel',
  faq: '/sss',
  guide: '/rehber',
  announcements: '/duyurular',
  announcementPattern: '/duyurular/:id',
  documents: '/belgeler',
  documentPattern: '/belgeler/:id',
  profile: '/profil',

  staff: Object.freeze({
    home: '/personel',
    questions: '/personel/sorular',
    documentProposals: '/personel/belge-onerileri',
    documentProposalNew: '/personel/belge-onerileri/yeni',
    announcementProposals: '/personel/duyuru-onerileri',
    announcementProposalNew: '/personel/duyuru-onerileri/yeni',
    stats: '/personel/istatistikler',
  }),

  admin: Object.freeze({
    home: '/yonetim',
    users: '/yonetim/kullanicilar',
    staffRequests: '/yonetim/personel-basvurulari',
    documents: '/yonetim/belgeler',
    documentProposals: '/yonetim/belge-onerileri',
    announcements: '/yonetim/duyurular',
    announcementProposals: '/yonetim/duyuru-onerileri',
    feedback: '/yonetim/geri-bildirimler',
    reports: '/yonetim/raporlar',
  }),

  designSystem: '/tasarim-sistemi',
})
