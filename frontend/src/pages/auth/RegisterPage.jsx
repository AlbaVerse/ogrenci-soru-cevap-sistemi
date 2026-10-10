import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, Button, Input, PasswordInput, Select } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useFormState } from '@/hooks/useFormState'
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit'
import { authService } from '@/services'
import { mapFieldErrors } from '@/services/adapters/fieldErrors'
import {
  compactErrors,
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from '@/utils/validators'

// "Admin" seçeneği bilerek yoktur: yönetici yetkisi kayıt sırasında istenemez.
const USER_TYPES = [
  { value: 'student', label: 'Öğrenci' },
  { value: 'staff', label: 'Personel' },
]

const FIELD_MAP = {
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  password: 'password',
  requested_role: 'userType',
}

export function RegisterPage() {
  const navigate = useNavigate()
  const form = useFormState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    userType: 'student',
  })
  const { values, setFormError, showErrors } = form
  const { attachForm } = form

  const submit = useCallback(async () => {
    setFormError(null)
    const errors = compactErrors({
      firstName: validateName(values.firstName, 'Ad'),
      lastName: validateName(values.lastName, 'Soyad'),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      passwordConfirm: validatePasswordConfirm(values.password, values.passwordConfirm),
    })
    if (Object.keys(errors).length) return showErrors(errors)

    const email = normalizeEmail(values.email)
    const requestedRole = values.userType === 'staff' ? 'staff' : 'student'
    try {
      await authService.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email,
        password: values.password,
        requestedRole,
      })
      navigate(ROUTES.verifyPending, { state: { email, staffRequested: requestedRole === 'staff' } })
    } catch (err) {
      const fieldErrors = mapFieldErrors(err, FIELD_MAP)
      if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      else setFormError(err?.message || 'Kayıt tamamlanamadı. Yeniden dene.')
    }
  }, [values, navigate, setFormError, showErrors])

  const [run, pending] = useGuardedSubmit(submit)

  return (
    <AuthLayout title="Kayıt ol" description="Yalnızca @ostimteknik.edu.tr uzantılı üniversite e-postasıyla kayıt olabilirsin.">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Ad" autoComplete="given-name" required {...form.bind('firstName')} />
          <Input label="Soyad" autoComplete="family-name" required {...form.bind('lastName')} />
        </div>
        <Input
          label="Üniversite e-posta adresi"
          type="email"
          autoComplete="email"
          placeholder="ad.soyad@ostimteknik.edu.tr"
          required
          {...form.bind('email')}
        />
        <PasswordInput
          label="Şifre"
          autoComplete="new-password"
          hint="En az 8 karakter; en az bir harf ve bir rakam içermeli."
          required
          {...form.bind('password')}
        />
        <PasswordInput label="Şifre tekrar" autoComplete="new-password" required {...form.bind('passwordConfirm')} />
        <Select label="Kullanıcı türü" options={USER_TYPES} {...form.bind('userType')} />

        {values.userType === 'staff' && (
          <Alert tone="info" title="Personel yetkisi onay gerektirir">
            E-postanı doğruladıktan sonra personel yetkin yönetici onayına gönderilir. Onay beklerken öğrenci
            özelliklerini kullanabilirsin.
          </Alert>
        )}

        <Button type="submit" className="w-full" loading={pending}>
          Kayıt ol
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Zaten hesabın var mı?{' '}
        <Link to={ROUTES.login} className="font-medium text-brand underline underline-offset-2">
          Giriş yap
        </Link>
      </p>
    </AuthLayout>
  )
}
