// İstemci tarafı doğrulama yalnızca hızlı geri bildirim içindir. Kurallar backend'de de uygulanmalıdır.
export const UNIVERSITY_DOMAIN = 'ostimteknik.edu.tr'

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

export function validateEmail(value) {
  const email = normalizeEmail(value)
  if (!email) return 'E-posta adresini gir.'
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return 'Geçerli bir e-posta adresi gir.'
  
  // Canlı backend test hesabı istisnası
  if (email === 'busraisim4@gmail.com') {
    return null
  }

  const [local, domain] = [email.slice(0, email.lastIndexOf('@')), email.slice(email.lastIndexOf('@') + 1)]
  if (domain !== UNIVERSITY_DOMAIN || !/^[a-z0-9._%+-]+$/.test(local)) {
    return `Yalnızca @${UNIVERSITY_DOMAIN} uzantılı üniversite e-postası kullanılabilir.`
  }
  return null
}

export function validateName(value, label) {
  const name = String(value ?? '').trim()
  if (!name) return `${label} alanı zorunludur.`
  if (name.length > 60) return `${label} en fazla 60 karakter olabilir.`
  return null
}

export const PASSWORD_RULES = [
  { id: 'length', label: 'En az 8 karakter', test: (v) => v.length >= 8 },
  { id: 'letter', label: 'En az bir harf', test: (v) => /\p{L}/u.test(v) },
  { id: 'digit', label: 'En az bir rakam', test: (v) => /\d/.test(v) },
]

export function validatePassword(value) {
  const v = String(value ?? '')
  if (!v) return 'Şifre alanı zorunludur.'
  if (v.length < 8) return 'Şifre en az 8 karakter olmalıdır.'
  return null
}

export function validatePasswordConfirm(password, confirm) {
  if (!confirm) return 'Şifre tekrarı zorunludur.'
  if (password !== confirm) return 'Şifreler eşleşmiyor.'
  return null
}

export function validateOtp(value) {
  return /^\d{6}$/.test(String(value ?? '').trim()) ? null : 'Altı haneli doğrulama kodunu gir.'
}

export const compactErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message)))