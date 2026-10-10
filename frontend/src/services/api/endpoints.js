// Taslak endpoint yolları (docs/API_CONTRACT_DRAFT.md). Henüz doğrulanmadı.
// Gerçek Django API farklıysa yalnızca bu dosya ve mapper'lar güncellenir.
export const ENDPOINTS = Object.freeze({
  auth: Object.freeze({
    register: '/auth/register/',
    login: '/auth/login/',
    logout: '/auth/logout/',
    me: '/auth/me/',
    verifyEmail: '/auth/verify-email/',
    resendVerification: '/auth/resend-verification/',
    passwordReset: '/auth/password-reset/',
    passwordResetConfirm: '/auth/password-reset/confirm/',
    // ÖNERİ: Belgedeki taslakta yok; profil ekranındaki şifre değiştirme için gerekli.
    passwordChange: '/auth/password-change/',
  }),
  users: Object.freeze({
    me: '/users/me/',
  }),
})
