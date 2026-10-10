import { AppError } from '@/services/adapters/AppError'
import { mapUser } from '@/services/adapters/userMapper'
import { ENDPOINTS } from './endpoints'
import { http } from './httpClient'

const invalidResponse = () =>
  new AppError({ status: 502, code: 'invalid_response', message: 'Sunucudan beklenmeyen bir yanıt alındı.' })

const requireUser = (data) => {
  const user = mapUser(data?.user ?? data)
  if (!user) throw invalidResponse()
  return user
}

export const authApi = {
  /**
   * Oturum bilgisi. Giriş yoksa null döner.
   * DRF SessionAuthentication girişsiz isteklere 403 de döndürebildiği için 401 ve 403 "oturum yok" sayılır.
   */
  async getSession() {
    try {
      return requireUser(await http.get(ENDPOINTS.auth.me, { expectUnauthorized: true }))
    } catch (err) {
      if (err instanceof AppError && (err.status === 401 || err.status === 403)) return null
      throw err
    }
  },

  /**
   * Hata kodları (taslak): 401 invalid_credentials, 403 email_not_verified, 422 validation_error.
   * Başarılı yanıt kullanıcı nesnesini döndürür.
   */
  async login({ email, password }) {
    return requireUser(await http.post(ENDPOINTS.auth.login, { email, password }, { expectUnauthorized: true }))
  },

  /** İstenen rol `requestedRole` (student | staff). Admin rolü istemciden istenemez. */
  async register({ firstName, lastName, email, password, requestedRole }) {
    await http.post(
      ENDPOINTS.auth.register,
      { first_name: firstName, last_name: lastName, email, password, requested_role: requestedRole },
      { expectUnauthorized: true },
    )
  },

  /** Bağlantı doğrulaması: { token } — kod doğrulaması: { email, code }. */
  async verifyEmail({ token, email, code }) {
    const body = token ? { token } : { email, code }
    await http.post(ENDPOINTS.auth.verifyEmail, body, { expectUnauthorized: true })
  },

  async resendVerification({ email }) {
    await http.post(ENDPOINTS.auth.resendVerification, { email }, { expectUnauthorized: true })
  },

  async requestPasswordReset({ email }) {
    await http.post(ENDPOINTS.auth.passwordReset, { email }, { expectUnauthorized: true })
  },

  /** `uid` Django varsayılan sıfırlama bağlantılarında bulunur; yoksa gönderilmez. */
  async confirmPasswordReset({ uid, token, password }) {
    await http.post(
      ENDPOINTS.auth.passwordResetConfirm,
      { ...(uid ? { uid } : {}), token, password },
      { expectUnauthorized: true },
    )
  },

  async logout() {
    await http.post(ENDPOINTS.auth.logout, undefined, { expectUnauthorized: true })
  },

  async updateProfile({ firstName, lastName }) {
    return requireUser(await http.patch(ENDPOINTS.users.me, { first_name: firstName, last_name: lastName }))
  },

  async changePassword({ currentPassword, newPassword }) {
    await http.post(ENDPOINTS.auth.passwordChange, { current_password: currentPassword, new_password: newPassword })
  },
}
