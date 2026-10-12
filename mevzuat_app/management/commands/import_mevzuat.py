import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
import pdfplumber
import docx
from mevzuat_app.models import Kategori, Mevzuat, Kaynak

class Command(BaseCommand):
    help = 'PDF veya Word (DOCX) formatındaki mevzuat dosyalarını işler ve veritabanına aktarır.'

    def add_arguments(self, parser):
        parser.add_argument('--path', type=str, required=True, help='Dosya veya klasör yolu')
        parser.add_argument('--category', type=str, required=True, help='Mevzuat kategorisi')

    def extract_text_from_pdf(self, file_path):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text

    def extract_text_from_docx(self, file_path):
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        return "\n".join(full_text)

    def chunk_text(self, text, chunk_size=1000, overlap=100):
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks

    def handle(self, *args, **options):
        path = options['path']
        category_name = options['category']

        if not os.path.exists(path):
            self.stdout.write(self.style.ERROR(f'Dosya veya yol bulunamadı: {path}'))
            return

        kategori, _ = Kategori.objects.get_or_create(
            name=category_name,
            defaults={'slug': slugify(category_name)}
        )

        files_to_process = []
        if os.path.isfile(path):
            files_to_process.append(path)
        elif os.path.isdir(path):
            for root, _, files in os.walk(path):
                for file in files:
                    if file.lower().endswith(('.pdf', '.docx')):
                        files_to_process.append(os.path.join(root, file))

        kaynak_fields = [f.name for f in Kaynak._meta.get_fields()]

        for file_path in files_to_process:
            file_name = os.path.basename(file_path)
            doc_title, _ = os.path.splitext(file_name)

            self.stdout.write(self.style.SUCCESS(f'İşleniyor: {file_name}'))

            text = ""
            try:
                if file_path.lower().endswith('.pdf'):
                    text = self.extract_text_from_pdf(file_path)
                elif file_path.lower().endswith('.docx'):
                    text = self.extract_text_from_docx(file_path)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'{file_name} okunurken hata oluştu: {str(e)}'))
                continue

            if not text.strip():
                self.stdout.write(self.style.WARNING(f'{file_name} içeriği boş veya okunamadı.'))
                continue

            # Mevzuat kaydını content ve source_file ile birlikte kaydet / güncelle
            mevzuat, _ = Mevzuat.objects.update_or_create(
                title=doc_title,
                defaults={
                    'category': kategori,
                    'content': text.strip(),
                    'source_file': file_name,
                }
            )

            Kaynak.objects.filter(mevzuat=mevzuat).delete()
            chunks = self.chunk_text(text)
            for idx, chunk in enumerate(chunks):
                kaynak_kwargs = {'mevzuat': mevzuat}
                
                if 'content' in kaynak_fields:
                    kaynak_kwargs['content'] = chunk
                elif 'icerik' in kaynak_fields:
                    kaynak_kwargs['icerik'] = chunk
                elif 'metin' in kaynak_fields:
                    kaynak_kwargs['metin'] = chunk
                elif 'text' in kaynak_fields:
                    kaynak_kwargs['text'] = chunk

                if 'chunk_index' in kaynak_fields:
                    kaynak_kwargs['chunk_index'] = idx + 1
                elif 'sira_no' in kaynak_fields:
                    kaynak_kwargs['sira_no'] = idx + 1

                try:
                    Kaynak.objects.create(**kaynak_kwargs)
                except Exception as e:
                    pass
