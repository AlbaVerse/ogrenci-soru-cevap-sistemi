import { Link } from 'react-router-dom'
import { AlertCircle, FlaskConical } from 'lucide-react'
import { Card, ErrorState, Skeleton } from '@/components/ui'

export function DemoNotice({ children = 'Bu ekrandaki bilgiler örnek veridir; gerçek üniversite kayıtlarını temsil etmez.' }) {
  return <div role="note" className="flex items-start gap-2 rounded-xl border border-line bg-brand-soft px-3 py-2.5 text-xs leading-5 text-on-brand-soft">
    <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> <span><strong>Demo verisi:</strong> {children}</span>
  </div>
}
export function StatusView({ loading, error, retry, children }) {
  if (loading) return <div aria-label="İçerik yükleniyor" className="space-y-3"><Skeleton className="h-24 w-full"/><Skeleton className="h-52 w-full"/><Skeleton className="h-24 w-3/4"/></div>
  if (error) return <Card><ErrorState error={error} onRetry={retry}/></Card>
  return children
}
export function InfoPanel({ children }) {
  return <div className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true"/>{children}</div>
}
export function InternalLink({ to, children, className = '' }) {
  return <Link to={to} className={`inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline ${className}`}>{children}</Link>
}
export const dateTr = (value) => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed) : 'Tarih belirtilmedi'
}
export const timeTr = (value) => Number.isFinite(value) && value != null ? `${(value / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} sn` : 'Ölçüm yok'
export const compactCount = (value) => (value ?? 0).toLocaleString('tr-TR')

// Only absolute HTTP(S) or same-origin relative paths; reject javascript:, data:, etc.
export const safeFileUrl = (value) => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)) ? value : null
