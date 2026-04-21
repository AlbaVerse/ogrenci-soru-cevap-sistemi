import sqlite3
import os
import json 

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "..", "data", "database")
DB_PATH = os.path.join(DB_DIR, "pdf_data.db")

def create_tables():
    os.makedirs(DB_DIR, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            doc_type TEXT,
            title TEXT,
            document_date TEXT,
            summary TEXT,
            key_information TEXT
        )
        """)
        conn.commit()

def insert_document(file_name, data):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            
            joker_veriler = json.dumps(data.get("key_information", {}), ensure_ascii=False)

            cursor.execute("""
            INSERT INTO documents (file_name, doc_type, title, document_date, summary, key_information)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                file_name, 
                data.get("doc_type", "Bilinmiyor"),
                data.get("title", "N/A"),
                data.get("document_date", "N/A"),
                data.get("summary", "Özet yok"),
                joker_veriler
            ))
            conn.commit()
    except sqlite3.Error as e:
        print(f"Veritabanı Hatası ({file_name}): {e}")
    except Exception as e:
        print(f"Beklenmeyen Hata ({file_name}): {e}")