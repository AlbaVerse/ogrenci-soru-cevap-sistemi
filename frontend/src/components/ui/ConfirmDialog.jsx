import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * Geri alınamaz veya yetkili işlemler için onay penceresi.
 * onConfirm async olabilir; bu sürede butonlar kilitlenir. Kapatmak çağıranın sorumluluğundadır.
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  tone = 'primary',
}) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } catch {
      /* Hata gösterimi onConfirm'i sağlayan bileşenin sorumluluğundadır. */
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  )
}
