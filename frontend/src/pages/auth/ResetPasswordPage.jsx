import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, Button, PasswordInput } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useFormState } from '@/hooks/useFormState'
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit'
import { authService } from '@/services'
import { mapFieldErrors } from '@/services/adapters/fieldErrors'
import { compactErrors, validatePassword, validatePasswordConfirm } from '@/utils/validators'

const linkClass =
  'inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover'

/** E-postadaki bağlantıdan açılır: /sifre-sifirla?token=... (Django varsayılanı için isteğe bağlı &uid=...) */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const uid = params.get('uid')
  const form = useFormState({ password: '', passwordConfirm: '' })
  const { values, setFormError, showErrors } = form
  const { attachForm } = form
  const [done, setDone] = useState(false)
  const [tokenInvalid, setTokenInvalid] = useState(false)

  const submit = useCallback(async () => {
    setFormError(null)
    const errors = compactErrors({
      password: validatePassword(values.password),
      passwordConfirm: validatePasswordConfirm(values.password, values.passwordConfirm),
    })
    if (Object.keys(errors).length) return showErrors(errors)
    try {
      await authService.confirmPasswordReset({ uid, token, password: values.password })
      setDone(true)
    } catch (err) {
      const fieldErrors = mapFieldErrors(err, { password: 'password', new_password: 'password' })
      if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      else if (err?.status === 400 || err?.status === 404) setTokenInvalid(true)
      else setFormError(err?.message || 'Şifre sıfırlanamadı. Yeniden dene.')
    }
  }, [values, uid, token, setFormError, showErrors])

  const [run, pending] = useGuardedSubmit(submit)

  if (!token || tokenInvalid) {
    return (
      <AuthLayout title="Şifre sıfırla">
        <Alert tone="danger" title="Bağlantı geçersiz">
          Sıfırlama bağlantısı eksik, geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyebilirsin.
        </Alert>
        <Link to={ROUTES.forgotPassword} className={`${linkClass} mt-5`}>
          Yeni bağlantı iste
        </Link>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title="Şifren güncellendi">
        <Alert tone="success" title="Şifren değiştirildi">
          Yeni şifrenle giriş yapabilirsin.
        </Alert>
        <Link to={ROUTES.login} className={`${linkClass} mt-5`}>
          Giriş yap
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Yeni şifre belirle">
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
        <PasswordInput
          label="Yeni şifre"
          autoComplete="new-password"
          hint="En az 8 karakter; en az bir harf ve bir rakam içermeli."
          required
          {...form.bind('password')}
        />
        <PasswordInput label="Yeni şifre tekrar" autoComplete="new-password" required {...form.bind('passwordConfirm')} />
        <Button type="submit" className="w-full" loading={pending}>
          Şifreyi güncelle
        </Button>
      </form>
    </AuthLayout>
  )
}
