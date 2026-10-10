// Bileşenlerin tek giriş noktası. VITE_DATA_MODE'a göre mock veya gerçek API uygulaması seçilir.
// Koşul build sırasında sabitlenir; "api" derlemesine demo hesaplar ve mock veri girmez.
const implementation =
  import.meta.env.VITE_DATA_MODE === 'api' ? await import('./api') : await import('../mocks')

export const authService = implementation.authService

export const chatService = implementation.chatService
export const homeService = implementation.homeService

export const statsService = implementation.statsService
export const documentsService = implementation.documentsService
export const faqService = implementation.faqService
export const announcementsService = implementation.announcementsService

export const staffService = implementation.staffService

export const adminService = implementation.adminService
