// Mock durumu yalnızca sekme oturumunda (sessionStorage) tutulur. Parola veya token saklanmaz.
const PREFIX = 'albaverse.mock.'

export const mockStorage = {
  read(key) {
    try {
      const raw = sessionStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  write(key, value) {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      /* depolama kapalıysa demo durumu yalnızca bellekte kalmaz; sayfa yenilenince sıfırlanır */
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(PREFIX + key)
    } catch {
      /* yoksay */
    }
  },
  clearAll() {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => sessionStorage.removeItem(k))
    } catch {
      /* yoksay */
    }
  },
}

/** Ağ gecikmesini taklit eder (testlerde atlanır). */
export const delay = (ms = 220) =>
  new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : ms))
