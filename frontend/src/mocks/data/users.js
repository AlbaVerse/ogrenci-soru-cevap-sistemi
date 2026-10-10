// Yalnızca geliştirme/test amaçlı sabit demo parolası ve doğrulama kodu. Gizli bilgi değildir.
export const DEMO_PASSWORD = 'Demo1234!'
export const DEMO_VERIFICATION_CODE = '123456'

// Yalnızca geliştirme/test amaçlı örnek hesaplar. Gerçek kişi veya gerçek veri değildir.
// Veriler backend sözleşmesindeki (snake_case) biçimde tutulur; mapper'dan geçerek kullanılır.
export const DEMO_ACCOUNTS = {
  student: {
    label: 'Öğrenci',
    raw: {
      id: 'demo-student',
      first_name: 'İrem',
      last_name: 'Kaya',
      email: 'irem.kaya@ostimteknik.edu.tr',
      role: 'student',
      requested_role: 'student',
      staff_approval_status: null,
      email_verified: true,
      created_at: '2026-02-12T09:30:00Z',
    },
  },
  pendingStaff: {
    label: 'Onay bekleyen personel',
    raw: {
      id: 'demo-pending-staff',
      first_name: 'Mehmet',
      last_name: 'Demir',
      email: 'mehmet.demir@ostimteknik.edu.tr',
      role: 'student',
      requested_role: 'staff',
      staff_approval_status: 'pending',
      email_verified: true,
      created_at: '2026-09-28T11:00:00Z',
    },
  },
  staff: {
    label: 'Personel',
    raw: {
      id: 'demo-staff',
      first_name: 'Zeynep',
      last_name: 'Arslan',
      email: 'zeynep.arslan@ostimteknik.edu.tr',
      role: 'staff',
      requested_role: 'staff',
      staff_approval_status: 'approved',
      email_verified: true,
      created_at: '2025-10-03T08:15:00Z',
    },
  },
  admin: {
    label: 'Admin',
    raw: {
      id: 'demo-admin',
      first_name: 'Murat',
      last_name: 'Şahin',
      email: 'murat.sahin@ostimteknik.edu.tr',
      role: 'admin',
      requested_role: 'staff',
      staff_approval_status: 'approved',
      email_verified: true,
      created_at: '2025-08-20T07:00:00Z',
    },
  },
}
