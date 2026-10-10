import { describe, expect, it } from 'vitest'
import { mapUser } from './userMapper'

describe('mapUser', () => {
  it('backend alanlarını uygulama modeline çevirir', () => {
    const user = mapUser({
      id: 7,
      first_name: 'İrem',
      last_name: 'Kaya',
      email: 'irem@ostimteknik.edu.tr',
      role: 'student',
      requested_role: 'staff',
      staff_approval_status: 'pending',
      email_verified: true,
    })
    expect(user).toMatchObject({
      id: 7,
      fullName: 'İrem Kaya',
      initials: 'İK',
      role: 'student',
      requestedRole: 'staff',
      staffApprovalStatus: 'pending',
      emailVerified: true,
    })
  })

  it('tanınmayan rolü öğrenciye düşürür (güvenli varsayılan)', () => {
    expect(mapUser({ id: 1, email: 'a@b.c', role: 'superuser' }).role).toBe('student')
  })

  it('eksik alanlarda çökmez ve uydurma veri üretmez', () => {
    const user = mapUser({ email: 'x@ostimteknik.edu.tr' })
    expect(user.fullName).toBe('x@ostimteknik.edu.tr')
    expect(user.staffApprovalStatus).toBeNull()
    expect(user.emailVerified).toBe(false)
    expect(user.createdAt).toBeNull()
  })

  it('geçersiz girdi için null döner', () => {
    expect(mapUser(null)).toBeNull()
    expect(mapUser('abc')).toBeNull()
    expect(mapUser({})).toBeNull()
  })
})
