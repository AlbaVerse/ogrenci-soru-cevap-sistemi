import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { DemoNotice } from '@/components/layout/DemoNotice'
import { Alert, Button, Input, PasswordInput } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/context/auth-context'
import { useFormState } from '@/hooks/useFormState'
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit'
import { authService } from '@/services'
import { mapFieldErrors } from '@/services/adapters/fieldErrors'
import { compactErrors, normalizeEmail, validateEmail } from '@/utils/validators'

export function LoginPage() {
  const { login, sessionExpired, previewAccounts } = useAuth()
  const navigate = useNavigate()
  const form = useFormState({ email: '', password: '' })
  const { values, setField, setFormError, showErrors } = form
  const { attachForm } = form

  const submit = useCallback(async () => {
    setFormError(null)
    const errors = compactErrors({
      email: validateEmail(values.email),
      password: values.password ? null : 'Şifreni gir.',
    })
    if (Object.keys(errors).length) return showErrors(errors)

    const email = normalizeEmail(values.email)
    try {
      await login({ email, password: values.password })
      navigate(ROUTES.home, { replace: true }) // Başarılı girişten sonra karşılama ana sayfası
    } catch (err) {
      if (err?.code === 'email_not_verified') {
        navigate(ROUTES.verifyPending, { state: { email } })
        return
      }
      const fieldErrors = mapFieldErrors(err, { email: 'email', password: 'password' })
      if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      else setFormError(err?.message || 'Giriş yapılamadı. Yeniden dene.')
    }
  }, [values, login, navigate, setFormError, showErrors])

  const [run, pending] = useGuardedSubmit(submit)
  const demo = authService.demoHints

  return (
    <AuthLayout title="Giriş yap" description="Üniversite e-posta adresinle AlbaVerse'e giriş yap.">
      {sessionExpired && (
        <Alert tone="warning" title="Oturum süren doldu" className="mb-4">
          Güvenliğin için oturumun sonlandırıldı. Devam etmek için yeniden giriş yap.
        </Alert>
      )}
      <form
        ref={attachForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          run()
        }}
        className="space-y-4"
      >
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}
        <Input
          label="Üniversite e-posta adresi"
          type="email"
          autoComplete="username"
          placeholder="ad.soyad@ostimteknik.edu.tr"
          required
          {...form.bind('email')}
        />
        <PasswordInput label="Şifre" required {...form.bind('password')} />
        <div className="flex justify-end">
          <Link to={ROUTES.forgotPassword} className="text-sm font-medium text-brand underline underline-offset-2">
            Şifremi unuttum
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={pending}>
          Giriş yap
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Hesabın yok mu?{' '}
        <Link to={ROUTES.register} className="font-medium text-brand underline underline-offset-2">
          Kayıt ol
        </Link>
      </p>

      {demo && previewAccounts && (
        <DemoNotice title="Demo hesaplar" className="mt-6">
          <p>
            Hepsinin parolası: <code className="rounded bg-surface px-1.5 py-0.5">{demo.password}</code>
          </p>
          <ul className="space-y-1">
            {previewAccounts.map((account) => (
              <li key={account.key}>
                <button
                  type="button"
                  onClick={() => {
                    setField('email', account.email)
                    setField('password', demo.password)
                  }}
                  className="text-left underline underline-offset-2"
                >
                  {account.label}: {account.email}
                </button>
              </li>
            ))}
          </ul>
        </DemoNotice>
      )}
    </AuthLayout>
  )
}
