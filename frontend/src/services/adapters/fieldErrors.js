/**
 * Backend alan hatalarını ({ first_name: ['Zorunlu'] }) form alanlarına ({ firstName: 'Zorunlu' }) çevirir.
 * map: { backendAlan: 'formAlanı' }. Tanımsız alanlar yok sayılır (form düzeyi hataya düşer).
 */
export function mapFieldErrors(error, map = {}) {
  const result = {}
  const fields = error?.fields
  if (!fields || typeof fields !== 'object') return result
  Object.entries(fields).forEach(([key, value]) => {
    const target = map[key]
    if (!target) return
    const message = Array.isArray(value) ? value[0] : value
    if (typeof message === 'string' && message) result[target] = message
  })
  return result
}
