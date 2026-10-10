import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatComposer } from './ChatComposer'
import { SourceCards } from './SourceCards'

describe('ChatComposer', () => {
  it('Enter ile gönderir, Shift+Enter ile göndermez', () => {
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)
    const textbox = screen.getByRole('textbox', { name: 'Sorunuz' })
    fireEvent.change(textbox, { target: { value: 'Merhaba' } })
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('Merhaba')
  })
})

describe('SourceCards', () => {
  it('olmayan PDF bağlantısını üretmez ve javascript protokolünü engeller', () => {
    render(<SourceCards sources={[{ title: 'Örnek', url: 'javascript:alert(1)', page: 7, article: 'Madde 3' }]} />)
    expect(screen.getByText('Örnek')).toBeInTheDocument()
    expect(screen.getByText('Sayfa 7 · Madde 3')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
