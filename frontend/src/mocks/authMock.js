import { AppError } from '@/services/adapters/AppError'
import { mapUser } from '@/services/adapters/userMapper'
import { normalizeEmail, validateEmail, validatePassword } from '@/utils/validators'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_VERIFICATION_CODE } from './data/users'
import { delay, mockStorage } from './storage'

/*
 * Demo kimlik doğrulama. Gerçek bir güvenlik katmanı DEĞİLDİR.
 * - Demo hesaplar sabit demo parolasıyla (DEMO_PASSWORD) girer.
 * - Kayıt olan hesapların parolaları yalnızca bellekte tutulur; sayfa yenilenince kaybolur.
 *   (Hesap kaydı sessionStorage'da kalır ama parolası yoktur; yeniden kayıt veya "Demo verisini sıfırla" gerekir.)
 */
const SESSION_KEY = 'session'
const USERS_KEY = 'users' // { [email]: rawUser } — kayıt olanlar ve düzenlenen demo hesaplar
const passwords = new Map() // email → parola (yalnızca bellek)

const verifyToken = (email) => `demo-verify.${email}`
const resetToken = (email) => `demo-reset.${email}`

const demoByEmail = (email) =>
  Object.values(DEMO_ACCOUNTS).find((account) => account.raw.email === email)?.raw ?? null

const storedUsers = () => mockStorage.read(USERS_KEY) ?? {}
const findRaw = (email) => storedUsers()[email] ?? demoByEmail(email)
const saveRaw = (raw) => mockStorage.write(USERS_KEY, { ...storedUsers(), [raw.email]: raw })

const isDemoAccount = (email) => Boolean(demoByEmail(email))
const expectedPassword = (email) => passwords.get(email) ?? (isDemoAccount(email) ? DEMO_PASSWORD : null)

const fail = (status, code, message, fields) => new AppError({ status, code, message, fields })

const emailFromToken = (token, prefix) => {
  const value = String(token ?? '')
  return value.startsWith(`${prefix}.`) ? value.slice(prefix.length + 1) : null
}

export const authMock = {
  /** Yalnızca mock: arayüzdeki rol önizleme ve demo ipuçları için. */
  previewAccounts: Object.entries(DEMO_ACCOUNTS).map(([key, { label, raw }]) => ({ key, label, email: raw.email })),
  demoHints: {
    password: DEMO_PASSWORD,
    code: DEMO_VERIFICATION_CODE,
    verifyLink: (email) => `/e-posta-dogrulama?token=${encodeURIComponent(verifyToken(normalizeEmail(email)))}`,
    resetLink: (email) => `/sifre-sifirla?token=${encodeURIComponent(resetToken(normalizeEmail(email)))}`,
  },

  async getSession() {
    await delay()
    const session = mockStorage.read(SESSION_KEY)
    const raw = session ? findRaw(session.email) : null
    return raw ? mapUser(raw) : null
  },

  async login({ email, password }) {
    await delay()
    const address = normalizeEmail(email)
    const raw = findRaw(address)
    const expected = expectedPassword(address)
    if (!raw || expected === null || expected !== password) {
      throw fail(401, 'invalid_credentials', 'E-posta veya şifre hatalı.')
    }
    if (!raw.email_verified) {
      throw fail(403, 'email_not_verified', 'E-posta adresin henüz doğrulanmadı.')
    }
    mockStorage.write(SESSION_KEY, { email: address })
    return mapUser(raw)
  },

  async register({ firstName, lastName, email, password, requestedRole }) {
    await delay(300)
    const address = normalizeEmail(email)
    const emailError = validateEmail(address)
    if (emailError) throw fail(422, 'validation_error', undefined, { email: [emailError] })
    const passwordError = validatePassword(password)
    if (passwordError) throw fail(422, 'validation_error', undefined, { password: [passwordError] })
    if (findRaw(address)) {
      throw fail(409, 'email_taken', 'Bu e-posta adresiyle kayıtlı bir hesap var.', {
        email: ['Bu e-posta adresiyle kayıtlı bir hesap var.'],
      })
    }
    const wantsStaff = requestedRole === 'staff' // "admin" istemciden asla kabul edilmez
    saveRaw({
      id: `demo-${Date.now()}`,
      first_name: String(firstName).trim(),
      last_name: String(lastName).trim(),
      email: address,
      role: 'student',
      requested_role: wantsStaff ? 'staff' : 'student',
      staff_approval_status: wantsStaff ? 'pending' : null,
      email_verified: false,
      created_at: new Date().toISOString(),
    })
    passwords.set(address, password)
  },

  async verifyEmail({ token, email, code }) {
    await delay()
    const address = token ? emailFromToken(token, 'demo-verify') : normalizeEmail(email)
    const raw = address ? findRaw(address) : null
    const valid = token ? Boolean(raw) : Boolean(raw) && code === DEMO_VERIFICATION_CODE
    if (!valid) throw fail(422, 'invalid_verification', 'Doğrulama bağlantısı veya kodu geçersiz ya da süresi dolmuş.')
    saveRaw({ ...raw, email_verified: true })
  },

  async resendVerification() {
    await delay()
    // Hesap varlığı sızdırılmaz: her durumda başarılı döner.
  },

  async requestPasswordReset() {
    await delay()
  },

  async confirmPasswordReset({ token, password }) {
    await delay()
    const address = emailFromToken(token, 'demo-reset')
    if (!address || !findRaw(address)) {
      throw fail(400, 'invalid_token', 'Sıfırlama bağlantısı geçersiz veya süresi dolmuş.')
    }
    const passwordError = validatePassword(password)
    if (passwordError) throw fail(422, 'validation_error', undefined, { password: [passwordError] })
    passwords.set(address, password)
  },

  async logout() {
    await delay(100)
    mockStorage.remove(SESSION_KEY)
  },

  async updateProfile({ firstName, lastName }) {
    await delay()
    const session = mockStorage.read(SESSION_KEY)
    const raw = session ? findRaw(session.email) : null
    if (!raw) throw fail(401, 'not_authenticated')
    const next = { ...raw, first_name: String(firstName).trim(), last_name: String(lastName).trim() }
    saveRaw(next)
    return mapUser(next)
  },

  async changePassword({ currentPassword, newPassword }) {
    await delay()
    const session = mockStorage.read(SESSION_KEY)
    if (!session) throw fail(401, 'not_authenticated')
    if (expectedPassword(session.email) !== currentPassword) {
      throw fail(422, 'validation_error', undefined, { current_password: ['Mevcut şifre hatalı.'] })
    }
    const passwordError = validatePassword(newPassword)
    if (passwordError) throw fail(422, 'validation_error', undefined, { new_password: [passwordError] })
    passwords.set(session.email, newPassword)
  },

  // ---- Yalnızca mock: geliştirme/test yardımcıları ----

  /** Demo hesapla doğrudan oturum açar (üstteki "Rol önizleme" seçicisi için). */
  async signInAs(accountKey) {
    await delay(120)
    const account = DEMO_ACCOUNTS[accountKey]
    if (!account) throw fail(404, 'demo_account_not_found')
    mockStorage.write(SESSION_KEY, { email: account.raw.email })
    return mapUser(findRaw(account.raw.email))
  },

  /** Oturum süresinin dolmasını taklit eder: sunucu tarafı oturum silinir. */
  expireSession() {
    mockStorage.remove(SESSION_KEY)
  },

  resetDemo() {
    passwords.clear()
    mockStorage.clearAll()
  },
}
