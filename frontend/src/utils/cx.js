/** Koşullu className birleştirici. */
export function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ')
}
