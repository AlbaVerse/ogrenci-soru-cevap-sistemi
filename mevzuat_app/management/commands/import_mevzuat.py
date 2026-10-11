import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils.text import slugify
import pdfplumber
import docx
from mevzuat_app.models import Kategori, Mevzuat, Kaynak


class Command(BaseCommand):
    help = "PDF veya Word formatındaki mevzuat dosyalarını işler ve veritabanına aktarır."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            type=str,
            required=False,
            default=None,
            help="Dosya veya klasör yolu (belirtilmezse varsayılan mevzuat klasörleri taranır)"
        )
        parser.add_argument(
            "--category",
            type=str,
            required=False,
            default=None,
            help="Mevzuat kategorisi"
        )
        parser.add_argument("--chunk-size", type=int, default=1200, help="Karakter bazlı parça boyutu")
        parser.add_argument("--overlap", type=int, default=150, help="Parçalar arası örtüşme boyutu")

    def extract_text_from_pdf(self, file_path):
        pages_text = []
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                extracted = page.extract_text()
                if extracted and extracted.strip():
                    pages_text.append((page_num, extracted.strip()))
        return pages_text

    def extract_text_from_docx(self, file_path):
        doc = docx.Document(file_path)
        full_text = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        combined = "\n".join(full_text)
        return [(1, combined)] if combined else []

    def chunk_text(self, text, chunk_size=1200, overlap=150):
        chunks = []
        start = 0
        text_len = len(text)
        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunks.append(text[start:end].strip())
            if end >= text_len:
                break
            start += max(chunk_size - overlap, 1)
        return chunks

    def process_target(self, target_path, category_name, chunk_size, overlap):
        if not os.path.exists(target_path):
            self.stdout.write(self.style.WARNING(f"Yol bulunamadı: {target_path}"))
            return

        kategori, _ = Kategori.objects.get_or_create(
            name=category_name,
            defaults={"slug": slugify(category_name)},
        )

        files_to_process = []
        if os.path.isfile(target_path):
            files_to_process.append(target_path)
        elif os.path.isdir(target_path):
            for root, _, files in os.walk(target_path):
                for f in files:
                    if f.lower().endswith((".pdf", ".docx")):
                        files_to_process.append(os.path.join(root, f))

        self.stdout.write(self.style.NOTICE(f"[{category_name}] Toplam {len(files_to_process)} dosya işlenecek..."))

        for file_path in files_to_process:
            file_name = os.path.basename(file_path)
            doc_title, _ = os.path.splitext(file_name)

            try:
                if file_path.lower().endswith(".pdf"):
                    pages_data = self.extract_text_from_pdf(file_path)
                else:
                    pages_data = self.extract_text_from_docx(file_path)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"{file_name} okunurken hata: {e}"))
                continue

            if not pages_data:
                self.stdout.write(self.style.WARNING(f"{file_name} içeriği boş veya taranmış görsel."))
                continue

            full_text = "\n\n".join([page_text for _, page_text in pages_data])
            chunks = self.chunk_text(full_text, chunk_size=chunk_size, overlap=overlap)

            for idx, chunk in enumerate(chunks, start=1):
                mevzuat = Mevzuat.objects.create(
                    title=f"{doc_title} (Bölüm {idx})",
                    content=chunk,
                    chunk_index=idx,
                    category=kategori,
                    source_file=file_name,
                )

                approx_page = min(idx, len(pages_data))
                Kaynak.objects.create(
                    mevzuat=mevzuat,
                    url_or_path=file_path,
                    page_number=pages_data[approx_page - 1][0] if pages_data else 1,
                )

            self.stdout.write(self.style.SUCCESS(f"Aktarıldı: {file_name} -> {len(chunks)} parça oluşturuldu."))

    def handle(self, *args, **options):
        path = options.get("path")
        category_name = options.get("category")
        chunk_size = options["chunk_size"]
        overlap = options["overlap"]

        if path:
            cat = category_name or "Genel"
            self.process_target(path, cat, chunk_size, overlap)
        else:
            default_folders = {
                "YÖNETMELİKLER": "Yönetmelik",
                "YÖNERGELER": "Yönerge",
                "USUL ESASLAR": "Usul ve Esaslar",
                "POLİTİKALAR VE REHBERLİK": "Rehberlik ve Politikalar",
                "YÖK MEVZUAT": "YÖK Mevzuatı",
            }
            base_dir = settings.BASE_DIR
            self.stdout.write("Varsayılan mevzuat klasörleri taranıyor...")

            for folder_name, cat in default_folders.items():
                folder_path = os.path.join(base_dir, folder_name)
                if os.path.exists(folder_path):
                    self.process_target(folder_path, cat, chunk_size, overlap)
                else:
                    self.stdout.write(self.style.WARNING(f"Klasör atlandı (bulunamadı): {folder_name}"))

        self.stdout.write(self.style.SUCCESS("Mevzuat aktarım işlemi tamamlandı."))