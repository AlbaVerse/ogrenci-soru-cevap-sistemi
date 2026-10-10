// HTTP durum kodlarına göre varsayılan kullanıcı mesajları.
const MESSAGES = {
  0: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene.',
  400: 'İstek geçersiz. Girdiğin bilgileri kontrol et.',
  401: 'Oturum süren doldu. Devam etmek için yeniden giriş yap.',
  403: 'Bu işlem için yetkin yok.',
  404: 'İstenen kayıt bulunamadı.',
  409: 'Bu işlem mevcut bir kayıtla çakışıyor.',
  422: 'Gönderilen bilgilerde düzeltilmesi gereken alanlar var.',
  500: 'Sunucuda beklenmeyen bir sorun oluştu. Biraz sonra yeniden dene.',
}

export function defaultErrorMessage(status) {
  if (MESSAGES[status]) return MESSAGES[status]
  if (status >= 500) return MESSAGES[500]
  return 'İşlem tamamlanamadı. Yeniden dene.'
}
