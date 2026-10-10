import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { DemoNotice } from '@/components/layout/DemoNotice'
import { Alert, Button, Input } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useFormState } from '@/hooks/useFormState'
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit'
import { authService } from '@/services'
import { normalizeEmail, validateEmail } from '@/utils/validators'

export function ForgotPasswordPage() {
  const form = useFormState({ email: '' })
  const { values, setFormError, showErrors } = form
  const { attachForm } = form
  const [sentTo, setSentTo] = useState(null)

  const submit = useCallback(async () => {
    setFormError(null)
    const emailError = validateEmail(values.email)
    if (emailError) return showErrors({ email: emailError })
    const email = normalizeEmail(values.email)
    try {
      await authService.requestPasswordReset({ email })
      setSentTo(email)
    } catch (err) {
      setFormError(err?.message || 'İstek gönderilemedi. Yeniden dene.')
    }
  }, [values.email, setFormError, showErrors])

  const [run, pending] = useGuardedSubmit(submit)
  const demo = authService.demoHints

  return (
    <AuthLayout title="Şifremi unuttum" description="Üniversite e-posta adresini gir; şifre sıfırlama bağlantısını gönderelim.">
      {sentTo ? (
        <>
          {/* Hesap varlığı ifşa edilmez: mesaj her durumda aynıdır. */}
          <Alert tone="success" title="İstek alındı">
            {sentTo} adresi kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve gereksiz klasörünü kontrol et.
          </Alert>
          {demo && (
            <DemoNotice title="Demo sıfırlama bağlantısı" className="mt-4">
              <Link to={demo.resetLink(sentTo)} className="underline underline-offset-2">
                Sıfırlama bağlantısını aç
              </Link>
            </DemoNotice>
          )}
        </>
      ) : (
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
            autoComplete="email"
            placeholder="ad.soyad@ostimteknik.edu.tr"
            required
            {...form.bind('email')}
          />
          <Button type="submit" className="w-full" loading={pending}>
            Sıfırlama bağlantısı gönder
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-fg-muted">
        <Link to={ROUTES.login} className="font-medium text-brand underline underline-offset-2">
          Giriş sayfasına dön
        </Link>
      </p>
    </AuthLayout>
  )
}
