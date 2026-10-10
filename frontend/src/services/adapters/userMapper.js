const ROLES = ['student', 'staff', 'admin']
const APPROVALS = ['pending', 'approved', 'rejected']

const text = (v) => (typeof v === 'string' ? v.trim() : '')

/**
 * Backend kullanıcı nesnesini (snake_case) uygulama modeline çevirir.
 * Eksik alanlar uydurulmaz; tanınmayan rol güvenli tarafa (student) düşer.
 */
export function mapUser(raw) {
  if (!raw || typeof raw !== 'object') return null
  const email = text(raw.email)
  if (raw.id == null && !email) return null

  const firstName = text(raw.first_name ?? raw.firstName)
  const lastName = text(raw.last_name ?? raw.lastName)
  const role = ROLES.includes(raw.role) ? raw.role : 'student'
  const requested = raw.requested_role ?? raw.requestedRole
  const approval = raw.staff_approval_status ?? raw.staffApprovalStatus
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || email

  return {
    id: raw.id ?? email,
    firstName,
    lastName,
    fullName,
    email,
    role,
    requestedRole: ROLES.includes(requested) ? requested : role,
    staffApprovalStatus: APPROVALS.includes(approval) ? approval : null,
    emailVerified: Boolean(raw.email_verified ?? raw.emailVerified),
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    initials: initialsOf(firstName, lastName, email),
  }
}

function initialsOf(firstName, lastName, email) {
  const letters = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part[0].toLocaleUpperCase('tr-TR'))
    .join('')
  return letters || (email ? email[0].toLocaleUpperCase('tr-TR') : '?')
}
