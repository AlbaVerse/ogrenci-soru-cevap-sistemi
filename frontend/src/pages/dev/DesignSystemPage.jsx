import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PasswordInput,
  SearchInput,
  Select,
  Skeleton,
  Spinner,
  Textarea,
  Tooltip,
} from '@/components/ui'
import { useTheme } from '@/context/theme-context'
import { useToast } from '@/context/toast-context'

const SWATCHES = [
  ['canvas', 'bg-canvas'],
  ['surface', 'bg-surface'],
  ['surface-2', 'bg-surface-2'],
  ['primary', 'bg-primary'],
  ['brand-soft', 'bg-brand-soft'],
  ['rose', 'bg-rose'],
  ['deep', 'bg-deep'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
  ['info', 'bg-info'],
]

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/** Yalnızca geliştirme sunucusunda erişilebilir (/tasarim-sistemi). Üretim paketine girmez. */
export default function DesignSystemPage() {
  const toast = useToast()
  const { preference, resolvedTheme, setPreference } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <Page
      title="Tasarım sistemi"
      description="Ortak bileşenlerin ve tema token'larının önizlemesi. Yalnızca geliştirme sırasında görünür."
    >
      <Section title="Tema">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['light', 'dark', 'system'].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={preference === value ? 'primary' : 'secondary'}
              onClick={() => setPreference(value)}
              aria-pressed={preference === value}
            >
              {{ light: 'Açık', dark: 'Koyu', system: 'Sistem' }[value]}
            </Button>
          ))}
          <span className="text-sm text-fg-muted">Geçerli: {resolvedTheme === 'dark' ? 'koyu' : 'açık'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-lg border border-line">
              <div className={`h-12 ${cls}`} />
              <p className="px-2 py-1 text-xs text-fg-muted">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Butonlar">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Kaydet</Button>
          <Button variant="secondary">Vazgeç</Button>
          <Button variant="ghost">Ayrıntılar</Button>
          <Button variant="danger">
            <Trash2 className="size-4" aria-hidden="true" />
            Sil
          </Button>
          <Button loading>Gönderiliyor</Button>
          <Button disabled>Devre dışı</Button>
          <Button size="sm">Küçük</Button>
          <Button size="lg">Büyük</Button>
          <Button iconOnly aria-label="Ekle">
            <Plus className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </Section>

      <Section title="Form alanları">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Ad" placeholder="İrem" required />
          <Input label="E-posta" type="email" defaultValue="irem@ornek.com" error="Yalnızca @ostimteknik.edu.tr adresleri kabul edilir." />
          <PasswordInput label="Şifre" hint="En az 8 karakter olmalı." />
          <Select
            label="Kullanıcı türü"
            options={[
              { value: 'student', label: 'Öğrenci' },
              { value: 'staff', label: 'Personel' },
            ]}
            defaultValue="student"
          />
          <SearchInput aria-label="Belgelerde ara" value={query} onValueChange={setQuery} placeholder="Belgelerde ara" />
          <Textarea label="Açıklama" rows={3} hint="Kısa bir açıklama yaz." />
        </div>
      </Section>

      <Section title="Kartlar ve rozetler">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="font-medium">Standart kart</p>
            <p className="mt-1 text-sm text-fg-muted">Okunabilir, opak yüzey. Uzun metin ve tablolar için.</p>
          </Card>
          <Card interactive>
            <p className="font-medium">Etkileşimli kart</p>
            <p className="mt-1 text-sm text-fg-muted">Üzerine gelince hafifçe yükselir.</p>
          </Card>
          <div className="rounded-2xl bg-deep p-3">
            <Card variant="glass">
              <p className="font-medium">Cam kart</p>
              <p className="mt-1 text-sm text-fg-muted">Yalnızca karşılama ve bilgi alanlarında.</p>
            </Card>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge>Nötr</Badge>
          <Badge tone="primary">Birincil</Badge>
          <Badge tone="success">Yanıtlandı</Badge>
          <Badge tone="warning">Yetersiz</Badge>
          <Badge tone="danger">Cevaplanamadı</Badge>
          <Badge tone="info">İnceleniyor</Badge>
          <Avatar initials="İK" />
        </div>
      </Section>

      <Section title="Bildirimler">
        <div className="grid gap-3 sm:grid-cols-2">
          <Alert tone="info" title="Bilgi">Personel başvurun inceleniyor.</Alert>
          <Alert tone="success" title="Başarılı">Değişiklikler kaydedildi.</Alert>
          <Alert tone="warning" title="Dikkat">Bu belge arşive alınmak üzere.</Alert>
          <Alert tone="danger" title="Hata">İşlem tamamlanamadı.</Alert>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast.success('Kaydedildi')}>Başarı bildirimi</Button>
          <Button variant="secondary" size="sm" onClick={() => toast.error('İşlem tamamlanamadı')}>Hata bildirimi</Button>
          <Button variant="secondary" size="sm" onClick={() => toast.info('Bilgilendirme')}>Bilgi bildirimi</Button>
        </div>
      </Section>

      <Section title="Pencereler ve ipuçları">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Modal aç</Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Onay penceresi aç</Button>
          <Tooltip label="Bu bir ipucu" side="bottom">
            <Button variant="ghost">Üzerine gel</Button>
          </Tooltip>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Örnek pencere"
          description="Esc ile veya dışına tıklayarak kapanır; odak pencere içinde kalır."
          footer={<Button onClick={() => setModalOpen(false)}>Tamam</Button>}
        >
          <p className="text-sm">Pencere içeriği burada yer alır.</p>
        </Modal>
        <ConfirmDialog
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600))
            setConfirmOpen(false)
            toast.success('Örnek işlem tamamlandı (demo)')
          }}
          title="Sohbet silinsin mi?"
          description="Bu işlem geri alınamaz."
          confirmLabel="Sil"
          tone="danger"
        />
      </Section>

      <Section title="Açılır liste">
        <Accordion
          defaultOpenIds={['a']}
          items={[
            { id: 'a', title: 'Staj başvurusu nasıl yapılır?', content: 'Örnek cevap metni. Gerçek içerik backend ve belgelerden gelecek.' },
            { id: 'b', title: 'Ders kaydı nasıl yenilenir?', content: 'Örnek cevap metni.' },
          ]}
        />
      </Section>

      <Section title="Yükleniyor, boş ve hata durumları">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="space-y-3">
            <Spinner />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </Card>
          <Card>
            <EmptyState title="Henüz sohbet yok" description="İlk sorunu sorarak başla." action={<Button size="sm">Yeni sohbet</Button>} />
          </Card>
          <Card>
            <ErrorState message="Veriler yüklenemedi." onRetry={() => toast.info('Yeniden deneniyor')} />
          </Card>
        </div>
      </Section>
    </Page>
  )
}
