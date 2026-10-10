import { describe, expect, it } from 'vitest'
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validateOtp,
  validatePassword,
  validatePasswordConfirm,
} from './validators'

describe('validateEmail', () => {
  it.each(['irem.kaya@ostimteknik.edu.tr', '  Irem.Kaya@OSTIMTEKNIK.EDU.TR  ', 'a_b+c@ostimteknik.edu.tr'])(
    '%s geçerlidir',
    (email) => expect(validateEmail(email)).toBeNull(),
  )

  it('boş değeri reddeder', () => expect(validateEmail('   ')).toMatch(/gir/))

  it.each(['abc', 'abc@', '@ostimteknik.edu.tr', 'a b@ostimteknik.edu.tr', 'a@evil.com@ostimteknik.edu.tr'])('%s biçimsiz sayılır', (email) =>
    expect(validateEmail(email)).toBe('Geçerli bir e-posta adresi gir.'),
  )

  it.each([
    'ogrenci@gmail.com',
    'x@ostimteknik.edu.tr.evil.com',
    'x@sub.ostimteknik.edu.tr',
    'x@ostimteknik.edu',
    'x@ostimteknik.com.tr',
    'ostimteknik.edu.tr@evil.com',
  ])('%s üniversite alan adı olmadığı için reddedilir', (email) =>
    expect(validateEmail(email)).toMatch(/@ostimteknik\.edu\.tr/),
  )

  it('normalizeEmail küçük harfe çevirir ve kırpar', () =>
    expect(normalizeEmail('  A@B.COM ')).toBe('a@b.com'))
})

describe('validateName', () => {
  it('boş adı reddeder ve etiketi mesaja yazar', () => expect(validateName(' ', 'Soyad')).toBe('Soyad alanı zorunludur.'))
  it('Türkçe karakterleri kabul eder', () => expect(validateName('Şükrü', 'Ad')).toBeNull())
  it('çok uzun adı reddeder', () => expect(validateName('a'.repeat(61), 'Ad')).toMatch(/60/))
})

describe('validatePassword', () => {
  it.each(['abc12345', 'Şifre2026', 'x1xxxxxx'])('%s kuralları sağlar', (pw) => expect(validatePassword(pw)).toBeNull())
  it.each(['', 'kısa1', '12345678', 'sadeceharfler'])('%j reddedilir', (pw) => expect(validatePassword(pw)).not.toBeNull())
})

describe('validatePasswordConfirm / validateOtp', () => {
  it('eşleşmeyen şifreyi reddeder', () => expect(validatePasswordConfirm('a1a1a1a1', 'b')).toBe('Şifreler eşleşmiyor.'))
  it('eşleşen şifreyi kabul eder', () => expect(validatePasswordConfirm('x', 'x')).toBeNull())
  it('OTP tam altı rakam olmalı', () => {
    expect(validateOtp('123456')).toBeNull()
    expect(validateOtp('12345')).not.toBeNull()
    expect(validateOtp('12345a')).not.toBeNull()
  })
})
