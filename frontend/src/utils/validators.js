// İstemci tarafı doğrulama yalnızca hızlı geri bildirim içindir. Kurallar backend'de de uygulanmalıdır.
export const UNIVERSITY_DOMAIN = 'ostimteknik.edu.tr'

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

export function validateEmail(value) {
  const email = normalizeEmail(value)
  if (!email) return 'E-posta adresini gir.'
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return 'Geçerli bir e-posta adresi gir.'
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

/** Önerilen kural: en az 8 karakter, en az bir harf ve bir rakam. Backend'in kuralı kesinleşince güncellenir. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'En az 8 karakter', test: (v) => v.length >= 8 },
  { id: 'letter', label: 'En az bir harf', test: (v) => /\p{L}/u.test(v) },
  { id: 'digit', label: 'En az bir rakam', test: (v) => /\d/.test(v) },
]

export function validatePassword(value) {
  const v = String(value ?? '')
  if (!v) return 'Şifre gir.'
  return PASSWORD_RULES.every((rule) => rule.test(v))
    ? null
    : 'Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermeli.'
}

export function validatePasswordConfirm(password, confirm) {
  if (!confirm) return 'Şifreyi tekrar gir.'
  return password === confirm ? null : 'Şifreler eşleşmiyor.'
}

export function validateOtp(value) {
  return /^\d{6}$/.test(String(value ?? '').trim()) ? null : 'Altı haneli doğrulama kodunu gir.'
}

/** errors: { alan: mesaj|null } → yalnızca hata içerenleri döndürür. */
export const compactErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message)))
