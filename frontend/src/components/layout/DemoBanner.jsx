import { FlaskConical } from 'lucide-react'
import { IS_MOCK } from '@/config/env'
import { useAuth } from '@/context/auth-context'

/** Mock modunda her zaman görünür: verilerin örnek olduğunu ve sunucuya kaydedilmediğini belirtir. */
export function DemoBanner() {
  const { user, previewAccounts, previewSignIn, resetDemo, simulateSessionExpiry } = useAuth()
  if (!IS_MOCK) return null

  const current = previewAccounts?.find((account) => account.email === user?.email)?.key ?? ''

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-warning-soft px-4 py-2 text-sm text-fg">
      <p className="flex min-w-0 flex-1 items-start gap-2 basis-64">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Demo modu:</strong> Veriler örnektir ve gerçek bir sunucuya kaydedilmez.
        </span>
      </p>
      {user && previewSignIn && previewAccounts && (
        <label className="flex items-center gap-2">
          <span className="text-fg-muted">Rol önizleme (yalnızca geliştirme)</span>
          <select
            value={current}
            onChange={(event) => previewSignIn(event.target.value)}
            className="h-8 rounded-md border border-line-strong bg-surface px-2 text-sm"
          >
            {previewAccounts.map((account) => (
              <option key={account.key} value={account.key}>
                {account.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {user && simulateSessionExpiry && (
        <button type="button" onClick={simulateSessionExpiry} className="font-medium text-brand underline underline-offset-2">
          Oturum süresini doldur
        </button>
      )}
      {resetDemo && (
        <button type="button" onClick={resetDemo} className="font-medium text-brand underline underline-offset-2">
          Demo verisini sıfırla
        </button>
      )}
    </div>
  )
}
