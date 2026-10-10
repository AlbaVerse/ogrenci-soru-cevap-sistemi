import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { DemoNotice } from '@/components/layout/DemoNotice'
import { Alert, Button, Input } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useFormState } from '@/hooks/useFormState'
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit'
import { authService } from '@/services'
import { compactErrors, normalizeEmail, validateEmail, validateOtp } from '@/utils/validators'

const RESEND_COOLDOWN_SECONDS = 60

/**
 * Kayıt veya doğrulanmamış giriş sonrası gelinen sayfa. Doğrulama bağlantıyla (/e-posta-dogrulama?token=...)
 * ya da e-postadaki altı haneli kodla yapılabilir; backend hangisini seçerse arayüz ikisine de uyar.
 * Sayfa herkese açıktır: doğrulanmamış hesap giriş yapamadığı için oturum varsayılmaz.
 */
export function VerifyPendingPage() {
  const { state } = useLocation()
  const form = useFormState({ email: state?.email ?? '', code: '' })
  const { values, setFormError, showErrors } = form
  const { attachForm } = form
  const [verified, setVerified] = useState(false)
  const [resendMessage, setResendMessage] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const verify = useCallback(async () => {
    setFormError(null)
    const errors = compactErrors({ email: validateEmail(values.email), code: validateOtp(values.code) })
    if (Object.keys(errors).length) return showErrors(errors)
    try {
      await authService.verifyEmail({ email: normalizeEmail(values.email), code: values.code.trim() })
      setVerified(true)
    } catch (err) {
      setFormError(err?.message || 'Doğrulama tamamlanamadı. Yeniden dene.')
    }
  }, [values, setFormError, showErrors])

  const resend = useCallback(async () => {
    setFormError(null)
    setResendMessage(null)
    const emailError = validateEmail(values.email)
    if (emailError) return showErrors({ email: emailError })
    try {
      await authService.resendVerification({ email: normalizeEmail(values.email) })
      setResendMessage('Yeni doğrulama e-postası gönderildi. Gelen kutunu ve gereksiz klasörünü kontrol et.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setFormError(err?.message || 'E-posta gönderilemedi. Biraz sonra yeniden dene.')
    }
  }, [values.email, setFormError, showErrors])

  const [runVerify, verifying] = useGuardedSubmit(verify)
  const [runResend, resending] = useGuardedSubmit(resend)
  const demo = authService.demoHints
  const email = normalizeEmail(values.email)

  if (verified) {
    return (
      <AuthLayout title="E-posta doğrulandı">
        <Alert tone="success" title="Hesabın hazır">
          E-posta adresin doğrulandı. Şimdi giriş yapabilirsin.
          {state?.staffRequested && ' Personel yetkin yönetici onayına gönderildi; onay beklerken öğrenci özelliklerini kullanabilirsin.'}
        </Alert>
        <Link
          to={ROUTES.login}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          Giriş yap
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="E-postanı doğrula"
      description="Üniversite e-posta adresine bir doğrulama bağlantısı veya kodu gönderdik. Bağlantıya tıkla ya da altı haneli kodu aşağıya gir."
    >
      <form
        ref={attachForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          runVerify()
        }}
        className="space-y-4"
      >
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}
        {resendMessage && <Alert tone="success">{resendMessage}</Alert>}
        <Input label="E-posta adresi" type="email" autoComplete="email" required {...form.bind('email')} />
        <Input
          label="Doğrulama kodu"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          hint="E-postanda altı haneli kod varsa buraya gir."
          {...form.bind('code')}
        />
        <Button type="submit" className="w-full" loading={verifying}>
          Kodu doğrula
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          loading={resending}
          disabled={cooldown > 0}
          onClick={runResend}
        >
          {cooldown > 0 ? `Yeniden gönder (${cooldown} sn)` : 'Doğrulama e-postasını yeniden gönder'}
        </Button>
      </form>

      {state?.staffRequested && (
        <Alert tone="info" className="mt-4">
          Personel yetkin, e-postanı doğruladıktan sonra yönetici onayına gönderilecek.
        </Alert>
      )}

      {demo && (
        <DemoNotice title="Demo doğrulama" className="mt-6">
          <p>
            Kod: <code className="rounded bg-surface px-1.5 py-0.5">{demo.code}</code>
          </p>
          {email && (
            <p>
              <Link to={demo.verifyLink(email)} className="underline underline-offset-2">
                Doğrulama bağlantısını aç
              </Link>
            </p>
          )}
        </DemoNotice>
      )}

      <p className="mt-6 text-center text-sm text-fg-muted">
        <Link to={ROUTES.login} className="font-medium text-brand underline underline-offset-2">
          Giriş sayfasına dön
        </Link>
      </p>
    </AuthLayout>
  )
}
