import { useCallback, useId } from 'react'
import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Alert, Avatar, Badge, Button, Card, Input, PasswordInput } from '@/components/ui'
import { isPendingStaff, roleLabel } from '@/config/roles'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useToast } from '@/context/toast-context'
import { useFormState } from '@/hooks/useFormState'
import { useGuardedSubmit } from '@/hooks/useGuardedSubmit'
import { authService } from '@/services'
import { mapFieldErrors } from '@/services/adapters/fieldErrors'
import { cx } from '@/utils/cx'
import { compactErrors, validateName, validatePassword, validatePasswordConfirm } from '@/utils/validators'

function SectionCard({ title, description, children }) {
  return (
    <Card as="section" aria-label={title}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function StaffStatus({ user }) {
  if (user.requestedRole !== 'staff') return null
  if (user.role === 'staff' || user.staffApprovalStatus === 'approved') {
    return <Alert tone="success" title="Personel yetkin onaylandı" className="mb-4">Personel paneline Yönetim Paneli menüsünden ulaşabilirsin.</Alert>
  }
  if (isPendingStaff(user)) {
    return (
      <Alert tone="info" title="Personel başvurun inceleniyor" className="mb-4">
        Başvurun yönetici onayı bekliyor. Onaylanana kadar öğrenci özelliklerini kullanabilirsin.
      </Alert>
    )
  }
  if (user.staffApprovalStatus === 'rejected') {
    return (
      <Alert tone="warning" title="Personel başvurun onaylanmadı" className="mb-4">
        Öğrenci olarak kullanmaya devam edebilirsin. Ayrıntı için yöneticiyle iletişime geç.
      </Alert>
    )
  }
  return null
}

function AccountSection() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const form = useFormState({ firstName: user.firstName, lastName: user.lastName })
  const { values, setFormError, showErrors } = form
  const { attachForm } = form

  const submit = useCallback(async () => {
    setFormError(null)
    const errors = compactErrors({
      firstName: validateName(values.firstName, 'Ad'),
      lastName: validateName(values.lastName, 'Soyad'),
    })
    if (Object.keys(errors).length) return showErrors(errors)
    try {
      const updated = await authService.updateProfile({ firstName: values.firstName, lastName: values.lastName })
      updateUser(updated)
      toast.success('Profil bilgilerin güncellendi.')
    } catch (err) {
      const fieldErrors = mapFieldErrors(err, { first_name: 'firstName', last_name: 'lastName' })
      if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      else setFormError(err?.message || 'Profil güncellenemedi. Yeniden dene.')
    }
  }, [values, updateUser, toast, setFormError, showErrors])

  const [run, pending] = useGuardedSubmit(submit)
  const unchanged = values.firstName.trim() === user.firstName && values.lastName.trim() === user.lastName

  return (
    <SectionCard title="Hesap bilgileri">
      <div className="mb-4 flex items-center gap-3">
        <Avatar initials={user.initials} />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.fullName}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="primary">{roleLabel(user)}</Badge>
            <Badge tone={user.emailVerified ? 'success' : 'warning'}>
              {user.emailVerified ? 'E-posta doğrulandı' : 'E-posta doğrulanmadı'}
            </Badge>
          </div>
        </div>
      </div>
      <StaffStatus user={user} />
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
        <Input label="E-posta adresi" value={user.email} readOnly hint="E-posta adresi değiştirilemez." />
        <Button type="submit" loading={pending} disabled={unchanged}>
          Değişiklikleri kaydet
        </Button>
      </form>
    </SectionCard>
  )
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Açık', icon: Sun },
  { value: 'dark', label: 'Koyu', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
]

function ThemeSection() {
  const { preference, setPreference } = useTheme()
  const name = useId()
  return (
    <SectionCard title="Görünüm" description="Tercihin bu tarayıcıda saklanır.">
      <fieldset>
        <legend className="sr-only">Tema tercihi</legend>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className={cx(
                'flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm font-medium transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                preference === value ? 'border-primary bg-brand-soft text-on-brand-soft' : 'border-line-strong hover:bg-surface-2',
              )}
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={preference === value}
                onChange={() => setPreference(value)}
                className="sr-only"
              />
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </SectionCard>
  )
}

function PasswordSection() {
  const toast = useToast()
  const form = useFormState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
  const { values, setFormError, showErrors, reset } = form
  const { attachForm } = form

  const submit = useCallback(async () => {
    setFormError(null)
    const errors = compactErrors({
      currentPassword: values.currentPassword ? null : 'Mevcut şifreni gir.',
      newPassword: validatePassword(values.newPassword),
      newPasswordConfirm: validatePasswordConfirm(values.newPassword, values.newPasswordConfirm),
    })
    if (Object.keys(errors).length) return showErrors(errors)
    try {
      await authService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      reset()
      toast.success('Şifren değiştirildi.')
    } catch (err) {
      const fieldErrors = mapFieldErrors(err, { current_password: 'currentPassword', new_password: 'newPassword' })
      if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      else setFormError(err?.message || 'Şifre değiştirilemedi. Yeniden dene.')
    }
  }, [values, reset, toast, setFormError, showErrors])

  const [run, pending] = useGuardedSubmit(submit)

  return (
    <SectionCard title="Şifre değiştir">
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
        <PasswordInput label="Mevcut şifre" required {...form.bind('currentPassword')} />
        <PasswordInput
          label="Yeni şifre"
          autoComplete="new-password"
          hint="En az 8 karakter; en az bir harf ve bir rakam içermeli."
          required
          {...form.bind('newPassword')}
        />
        <PasswordInput label="Yeni şifre tekrar" autoComplete="new-password" required {...form.bind('newPasswordConfirm')} />
        <Button type="submit" loading={pending}>
          Şifreyi değiştir
        </Button>
      </form>
    </SectionCard>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <Page title="Profil ve Ayarlar" description="Hesap bilgilerini, görünüm tercihini ve şifreni yönet.">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <AccountSection />
          <ThemeSection />
        </div>
        <div className="space-y-5">
          <PasswordSection />
          <SectionCard title="Oturum">
            <Button variant="secondary" onClick={logout}>
              <LogOut className="size-4" aria-hidden="true" />
              Çıkış yap
            </Button>
          </SectionCard>
        </div>
      </div>
    </Page>
  )
}
