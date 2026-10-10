import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Accordion, Button, ConfirmDialog, Input, Modal, PasswordInput } from '@/components/ui'

describe('Button', () => {
  it('tıklanınca çalışır', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Kaydet</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('yüklenirken devre dışıdır ve ikinci gönderimi engeller', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Gönder</Button>)
    const button = screen.getByRole('button', { name: 'Gönder' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Input', () => {
  it('etiketi, ipucunu ve hatayı doğru bağlar', () => {
    const { rerender } = render(<Input label="E-posta" hint="Üniversite adresin" />)
    const input = screen.getByLabelText('E-posta')
    expect(input).toHaveAccessibleDescription('Üniversite adresin')
    expect(input).not.toHaveAttribute('aria-invalid')

    rerender(<Input label="E-posta" hint="Üniversite adresin" error="Geçersiz adres" />)
    expect(screen.getByLabelText('E-posta')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('E-posta')).toHaveAccessibleDescription('Geçersiz adres')
  })
})

describe('PasswordInput', () => {
  it('göster/gizle düğmesi alan türünü değiştirir', async () => {
    render(<PasswordInput label="Şifre" />)
    const input = screen.getByLabelText('Şifre')
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi göster' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Şifreyi gizle' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Accordion', () => {
  const items = [
    { id: 'a', title: 'Birinci', content: 'Birinci içerik' },
    { id: 'b', title: 'İkinci', content: 'İkinci içerik' },
  ]

  it('tek seferde bir öğe açar', async () => {
    render(<Accordion items={items} />)
    const first = screen.getByRole('button', { name: 'Birinci' })
    const second = screen.getByRole('button', { name: 'İkinci' })
    expect(first).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(second)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')
  })
})

function ModalHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Aç</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Başlık">
        <p>İçerik</p>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('açılır, başlıkla etiketlenir ve Kapat düğmesiyle kapanır', async () => {
    render(<ModalHarness />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }))
    expect(screen.getByRole('dialog', { name: 'Başlık' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Kapat' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('ConfirmDialog', () => {
  it('onaylanınca onConfirm çağrılır, vazgeçilince çağrılmaz', async () => {
    const onConfirm = vi.fn().mockResolvedValue()
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Silinsin mi?" confirmLabel="Sil" tone="danger" onConfirm={onConfirm} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Sil' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
