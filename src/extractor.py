import json
import time 
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY") 
client = Groq(api_key = GROQ_API_KEY)

def extract_metadata(text):
    prompt = f"""
    Sen çok zeki bir döküman analiz uzmanısın. Aşağıdaki belgeyi incele.
    Belgenin türü ne olursa olsun (Yönerge, Karar, Satın Alma, Öğrenci İşleri vb.),
    bu belgeye özel en kritik 8 veya 9 bilgiyi çıkar.

    SADECE JSON döndür:
    {{
      "doc_type": "Belgenin Türü (Örn: Yönerge, Usul ve Esas, Karar vb.)",
      "title": "Belgenin Başlığı",
      "document_date": "Varsa tarihi, yoksa 'Bilinmiyor'",
      "summary": "Belgenin 1-2 cümlelik özeti",
      "key_information": {{
          "anlamli_ingilizce_anahtar_kelime_1": "değeri",
          "anlamli_ingilizce_anahtar_kelime_2": "değeri"
      }}
    }}

    ÖNEMLİ KURALLAR: 
    1. 'key_information' içindeki anahtarları (key) belgenin içeriğine göre SEN İSİMLENDİR! 
    2. Anahtar isimleri küçük harfli, Türkçe karaktersiz ve boşluk yerine alt tire (_) içermelidir (Örn: "avans_limiti", "gno_sarti", "basvuru_suresi").
    3. Asla "buldugun_bilgi" gibi anlamsız genel isimler KULLANMA.

    METİN:
    {text}
    """

    max_deneme = 3  
    bekleme_suresi = 5  

    for deneme in range(max_deneme):
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant", 
                temperature=0.2,
                response_format={"type": "json_object"} 
            )
        
            content = chat_completion.choices[0].message.content
            return json.loads(content)
        
        except Exception as e:
            print(f"Yapay Zeka Hatası (Deneme {deneme + 1}/{max_deneme}): {e}")
            if deneme < max_deneme - 1:
                print(f"API yoruldu, {bekleme_suresi} saniye bekleniyor...")
                time.sleep(bekleme_suresi) 
            else:
                return None
    
    print("Hata: Maksimum deneme sayısına ulaşıldı, API isteği başarısız oldu.")
    return None