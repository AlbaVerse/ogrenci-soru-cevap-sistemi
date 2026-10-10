import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// WCAG kontrast oranı (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)
const channel = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')
const parseBlock = (selector) => {
  const start = css.indexOf(selector)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
}

const themes = { açık: parseBlock(":root[data-theme='light']"), koyu: parseBlock(":root[data-theme='dark']") }

// [ön plan, arka plan, en az oran]
const TEXT_PAIRS = [
  ['fg', 'canvas'], ['fg', 'surface'], ['fg', 'surface-2'],
  ['fg-muted', 'canvas'], ['fg-muted', 'surface'], ['fg-muted', 'surface-2'],
  ['on-primary', 'primary'], ['on-primary', 'primary-hover'],
  ['brand', 'canvas'], ['brand', 'surface'], ['on-brand-soft', 'brand-soft'],
  ['on-danger', 'danger'],
  ['success', 'success-soft'], ['warning', 'warning-soft'], ['danger', 'danger-soft'], ['info', 'info-soft'],
  ['success', 'surface'], ['danger', 'surface'],
]

describe.each(Object.entries(themes))('%s tema kontrastı', (_name, tokens) => {
  it.each(TEXT_PAIRS)('%s / %s en az 4.5:1 olmalı', (fg, bg) => {
    expect(tokens[fg], `${fg} tanımlı olmalı`).toBeDefined()
    expect(tokens[bg], `${bg} tanımlı olmalı`).toBeDefined()
    expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5)
  })

  it('odak halkası zemin üzerinde en az 3:1 olmalı', () => {
    expect(ratio(tokens.ring, tokens.canvas)).toBeGreaterThanOrEqual(3)
    expect(ratio(tokens.ring, tokens.surface)).toBeGreaterThanOrEqual(3)
  })
})
