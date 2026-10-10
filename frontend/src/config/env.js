// Ortam değişkenleri tek yerden okunur. Bileşenler import.meta.env'e doğrudan bağlanmaz.
export const DATA_MODE = import.meta.env.VITE_DATA_MODE === 'api' ? 'api' : 'mock'
export const IS_MOCK = DATA_MODE === 'mock'
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')
