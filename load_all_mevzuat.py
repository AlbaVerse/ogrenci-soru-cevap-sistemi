import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "alba_verse.settings")
django.setup()

from django.core.management import call_command

categories = {
    "YÖNETMELİKLER": "Yönetmelik",
    "YÖNERGELER": "Yönerge",
    "USUL ESASLAR": "Usul ve Esaslar",
    "POLİTİKALAR VE REHBERLİK": "Politika ve Rehberlik",
    "YÖK MEVZUAT": "YÖK Mevzuatı",
}

for folder, category in categories.items():
    if os.path.isdir(folder):
        print(f"Aktarılıyor: {folder} -> {category}")
        try:
            call_command("import_mevzuat", path=folder, category=category)
        except Exception as err:
            print(f"Hata ({folder}): {err}")

print("Tüm mevzuat aktarımı tamamlandı.")
