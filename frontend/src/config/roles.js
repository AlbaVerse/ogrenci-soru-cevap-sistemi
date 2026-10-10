export const ROLE = Object.freeze({ STUDENT: 'student', STAFF: 'staff', ADMIN: 'admin' })

export const isStaff = (user) => user?.role === ROLE.STAFF
export const isAdmin = (user) => user?.role === ROLE.ADMIN

/** Aktif rolü hâlâ öğrenci olan, personel başvurusu admin onayı bekleyen kullanıcı. */
export const isPendingStaff = (user) =>
  user?.role === ROLE.STUDENT && user?.requestedRole === ROLE.STAFF && user?.staffApprovalStatus === 'pending'

export function roleLabel(user) {
  if (!user) return ''
  if (user.role === ROLE.ADMIN) return 'Yönetici'
  if (user.role === ROLE.STAFF) return 'Personel'
  if (isPendingStaff(user)) return 'Öğrenci · personel onayı bekleniyor'
  return 'Öğrenci'
}
