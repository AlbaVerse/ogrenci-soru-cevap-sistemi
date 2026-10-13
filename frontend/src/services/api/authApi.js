import { AppError } from '@/services/adapters/AppError'
import { mapUser } from '@/services/adapters/userMapper'
import { ENDPOINTS } from './endpoints'
import { http, setAuthToken } from './httpClient'

const invalidResponse = () =>
  new AppError({ status: 502, code: 'invalid_response', message: 'Sunucudan beklenmeyen bir yanıt alındı.' })

const requireUser = (data) => {
  const user = mapUser(data?.user ?? data)
  if (!user) throw invalidResponse()
  return user
}

export const authApi = {
  async getSession() {
    try {
      return requireUser(await http.get(ENDPOINTS.auth.me, { expectUnauthorized: true }))
    } catch (err) {
      if (err instanceof AppError && (err.status === 401 || err.status === 403)) return null
      throw err
    }
  },

  async login({ email, password }) {
    const res = await http.post(ENDPOINTS.auth.login, { email, password }, { expectUnauthorized: true })
    if (res?.token) {
      setAuthToken(res.token)
    }
    return requireUser(res)
  },

  async register({ firstName, lastName, email, password, requestedRole }) {
    await http.post(
      ENDPOINTS.auth.register,
      { first_name: firstName, last_name: lastName, email, password, requested_role: requestedRole },
      { expectUnauthorized: true },
    )
  },

  async verifyEmail({ token, email, code }) {
    const body = token ? { token } : { email, code }
    const res = await http.post(ENDPOINTS.auth.verifyEmail, body, { expectUnauthorized: true })
    if (res?.token) {
      setAuthToken(res.token)
    }
    return res
  },

  async resendVerification({ email }) {
    await http.post(ENDPOINTS.auth.resendVerification, { email }, { expectUnauthorized: true })
  },

  async requestPasswordReset({ email }) {
    await http.post(ENDPOINTS.auth.passwordReset, { email }, { expectUnauthorized: true })
  },

  async confirmPasswordReset({ uid, token, password }) {
    await http.post(
      ENDPOINTS.auth.passwordResetConfirm,
      { ...(uid ? { uid } : {}), token, password },
      { expectUnauthorized: true },
    )
  },

  async logout() {
    try {
      await http.post(ENDPOINTS.auth.logout, undefined, { expectUnauthorized: true })
    } finally {
      setAuthToken(null)
    }
  },

  async updateProfile({ firstName, lastName }) {
    return requireUser(await http.patch(ENDPOINTS.users.me, { first_name: firstName, last_name: lastName }))
  },

  async changePassword({ currentPassword, newPassword }) {
    await http.post(ENDPOINTS.auth.passwordChange, { current_password: currentPassword, new_password: newPassword })
  },
}