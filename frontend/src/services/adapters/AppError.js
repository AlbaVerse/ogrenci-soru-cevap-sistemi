import { defaultErrorMessage } from '@/config/errorMessages'

/** Uygulama genelinde tek biçimli hata. Backend/ağ hataları buna çevrilir. */
export class AppError extends Error {
  constructor({ status = 0, code = 'unknown_error', message, fields = null, cause } = {}) {
    super(message || defaultErrorMessage(status))
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.fields = fields
    if (cause) this.cause = cause
  }
}

export const isAppError = (err) => err instanceof AppError

/**
 * Önerilen hata gövdesi: { error: { code, message, fields } }.
 * Gövde farklı gelirse varsayılan mesaja düşer.
 */
export function appErrorFromResponse(status, body) {
  const err = body && typeof body === 'object' ? body.error : null
  return new AppError({
    status,
    code: typeof err?.code === 'string' ? err.code : `http_${status}`,
    message: typeof err?.message === 'string' && err.message ? err.message : undefined,
    fields: err?.fields && typeof err.fields === 'object' ? err.fields : null,
  })
}
