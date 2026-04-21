from pypdf import PdfReader

def read_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text

if __name__ == "__main__":
    test_dosyasi = r"C:\Users\BÜŞRA\OneDrive\Masaüstü\pdf_project\data\pdfs\198694.pdf" 
    
    print("PDF okunuyor, lütfen bekle...")
    okunan_metin = read_pdf(test_dosyasi)
    
    print("\n--- İŞTE PDF'İN İÇİNDEKİLER ---")
    print(okunan_metin)