import { Link } from 'react-router-dom'
import { Hourglass, TriangleAlert } from 'lucide-react'
import { isPendingStaff } from '@/config/roles'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/context/auth-context'

/** Personel başvurusu bekleyen veya reddedilen kullanıcıya durumunu açıkça gösteren ince şerit. */
export function StaffApprovalNotice() {
  const { user } = useAuth()
  const rejected = user?.role === 'student' && user?.requestedRole === 'staff' && user?.staffApprovalStatus === 'rejected'
  if (!isPendingStaff(user) && !rejected) return null

  const Icon = rejected ? TriangleAlert : Hourglass
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-4 py-2 text-sm ${
        rejected ? 'bg-warning-soft' : 'bg-info-soft'
      }`}
    >
      <Icon className={`size-4 shrink-0 ${rejected ? 'text-warning' : 'text-info'}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 basis-60">
        {rejected
          ? 'Personel başvurun onaylanmadı. Öğrenci olarak kullanmaya devam edebilirsin.'
          : 'Personel başvurun yönetici onayı bekliyor. Bu sürede öğrenci özelliklerini kullanabilirsin.'}
      </p>
      <Link to={ROUTES.profile} className="font-medium text-brand underline underline-offset-2">
        Ayrıntılar
      </Link>
    </div>
  )
}
