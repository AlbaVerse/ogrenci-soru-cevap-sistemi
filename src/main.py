import os
import time 
from pdf_reader import read_pdf
from extractor import extract_metadata
from db_manager import create_tables, insert_document

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_FOLDER = os.path.join(BASE_DIR, "..", "data", "pdfs")

def main(): 
    create_tables()

    try:
        pdf_dosyalari = [f for f in os.listdir(PDF_FOLDER) if f.endswith(".pdf")]
    except FileNotFoundError:
        print(f"Klasör bulunamadı. Aranan yer: {PDF_FOLDER}")
        return

    if not pdf_dosyalari:
        print("Klasörde hiç PDF bulunamadı. Lütfen data/pdfs/ içine PDF ekle.")
        return

    print(f"Toplam {len(pdf_dosyalari)} adet PDF bulundu. İşlem başlıyor...\n")

    for file_name in pdf_dosyalari:
        print(f"İşleniyor: {file_name}...")
        file_path = os.path.join(PDF_FOLDER, file_name)


        tam_metin = read_pdf(file_path)

        if not tam_metin.strip():
            print(f"Atlandı: {file_name} (Metin okunamadı, muhtemelen fotoğraf/taranmış PDF)\n")
            continue

        if len(tam_metin) > 6000:
            text = tam_metin[:4000] + "\n\n...[BELGENİN ORTA KISMI ATLANDI]...\n\n" + tam_metin[-2000:]
        else:
            text = tam_metin 
        
        extracted_data = extract_metadata(text)

        if extracted_data is not None:
            insert_document(file_name, extracted_data)
            print(f"Başarılı: {file_name} işlendi ve kaydedildi!")
            
            time.sleep(2.5) 
            print("-" * 30)
        else:
            print(f"Atlandı: {file_name} (API'den veri alınamadı)\n")

    print("\nTÜM PDF'LER İŞLENDİ!")

if __name__ == "__main__":
    main()