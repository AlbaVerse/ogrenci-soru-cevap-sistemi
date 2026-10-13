// Canlı Render backend entegrasyonu için doğrudan 'api' moduna ayarlandı
export const DATA_MODE = 'api'
export const IS_MOCK = false
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')