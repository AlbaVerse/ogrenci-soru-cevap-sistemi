import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './theme-context'

function Probe() {
  const { preference, resolvedTheme, toggle, setPreference } = useTheme()
  return (
    <>
      <p data-testid="state">{`${preference}:${resolvedTheme}`}</p>
      <button onClick={toggle}>değiştir</button>
      <button onClick={() => setPreference('system')}>sistem</button>
    </>
  )
}

const mockSystemDark = (dark) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query) => ({
      matches: dark,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )

beforeEach(() => vi.unstubAllGlobals())

describe('ThemeProvider', () => {
  it('kayıtlı tercih yokken sistem temasını izler', () => {
    mockSystemDark(true)
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('state')).toHaveTextContent('system:dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('geçiş yapınca <html> özniteliğini günceller ve tercihi saklar', async () => {
    mockSystemDark(false)
    render(<ThemeProvider><Probe /></ThemeProvider>)
    await userEvent.click(screen.getByText('değiştir'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('albaverse.theme')).toBe('dark')
  })

  it('"sistem" seçilince saklanan tercihi siler', async () => {
    localStorage.setItem('albaverse.theme', 'dark')
    mockSystemDark(false)
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark')
    await userEvent.click(screen.getByText('sistem'))
    expect(localStorage.getItem('albaverse.theme')).toBeNull()
    expect(screen.getByTestId('state')).toHaveTextContent('system:light')
  })
})
