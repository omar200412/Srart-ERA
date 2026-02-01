import os
import sqlite3
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# PDF Kütüphaneleri
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# .env dosyasını yükle
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL") # Render'dan gelecek URL

# --- MODEL AYARI ---
try:
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash") # En güncel ve hızlı model
        print("✅ Gemini 2.0 FLASH Modeli Hazır!")
except Exception as e:
    print(f"Model Hatası: {e}")

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- VERİTABANI BAĞLANTISI (AKILLI GEÇİŞ) ---
def get_db_connection():
    """PostgreSQL varsa ona, yoksa SQLite'a bağlanır."""
    if DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        except Exception as e:
            print(f"PostgreSQL Bağlantı Hatası: {e}")
            return None
    else:
        # Lokal geliştirme için SQLite
        conn = sqlite3.connect("chatbot.db")
        conn.row_factory = sqlite3.Row
        return conn

# --- TABLO OLUŞTURMA ---
def init_db():
    conn = get_db_connection()
    if not conn:
        print("Veritabanı bağlantısı kurulamadı!")
        return
    
    cursor = conn.cursor()
    
    # PostgreSQL ve SQLite için uyumlu tablo oluşturma sorguları
    if DATABASE_URL:
        # PostgreSQL
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                role TEXT,
                message TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
    else:
        # SQLite
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT,
                message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)

    conn.commit()
    conn.close()
    print("✅ Veritabanı tabloları kontrol edildi.")

init_db()

# --- MODELLER ---
class UserAuth(BaseModel):
    email: str
    password: str

class BusinessPlanRequest(BaseModel):
    business_idea: str
    language: str = "tr"

class ChatRequest(BaseModel):
    message: str
    language: str = "tr"

# --- HELPER: SQL PLACEHOLDER ---
def get_placeholder():
    """Postgres için %s, SQLite için ? döndürür"""
    return "%s" if DATABASE_URL else "?"

# --- ENDPOINTS ---

@app.post("/register")
def register(user: UserAuth):
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    
    ph = get_placeholder() # %s veya ?
    query = f"INSERT INTO users (email, password) VALUES ({ph}, {ph})"
    
    try:
        cursor.execute(query, (user.email, hashed_pw))
        conn.commit()
        return {"message": "Kayıt Başarılı"}
    except Exception as e: # IntegrityError genelleştirildi
        conn.rollback()
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kullanılıyor.")
    finally:
        conn.close()

@app.post("/login")
def login(user: UserAuth):
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    
    ph = get_placeholder()
    query = f"SELECT * FROM users WHERE email={ph} AND password={ph}"
    
    cursor.execute(query, (user.email, hashed_pw))
    user_data = cursor.fetchone()
    conn.close()
    
    if user_data:
        # PostgreSQL RealDictCursor sözlük döner, SQLite Row nesnesi döner (ikisi de erişilebilir)
        return {"token": f"user-token-{user.email}", "message": "Giriş Başarılı"}
    else:
        raise HTTPException(status_code=401, detail="Hatalı E-posta veya Şifre")

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ph = get_placeholder()
        
        # Kullanıcı mesajını kaydet
        cursor.execute(f"INSERT INTO chat_history (role, message) VALUES ({ph}, {ph})", ("user", req.message))
        conn.commit()

        # AI Cevabı
        if api_key:
            system_instruction = f"Sen Start ERA asistanısın. Dil: {req.language}. Soru: {req.message}"
            response = model.generate_content(system_instruction)
            reply = response.text
        else:
            reply = "API Anahtarı eksik!"

        # Bot cevabını kaydet
        cursor.execute(f"INSERT INTO chat_history (role, message) VALUES ({ph}, {ph})", ("bot", reply))
        conn.commit()
        conn.close()
        
        return {"reply": reply}
    except Exception as e:
        print(f"Chat Hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
def history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role, message FROM chat_history ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    
    # Veri formatını ayarla
    history_data = []
    for row in rows:
        # Row veya Dict erişimi
        role = row['role'] if isinstance(row, dict) or hasattr(row, '__getitem__') else row[0]
        msg = row['message'] if isinstance(row, dict) or hasattr(row, '__getitem__') else row[1]
        history_data.append({"text": msg, "isBot": (role == "bot")})
        
    return history_data

@app.post("/generate_plan")
def generate_plan(req: BusinessPlanRequest):
    try:
        prompt = f"İş planı hazırla: {req.business_idea}. Dil: {req.language}"
        response = model.generate_content(prompt)
        text_content = response.text.replace("*", "")
        
        pdf_filename = "StartERA_Plan.pdf"
        doc = SimpleDocTemplate(pdf_filename, pagesize=letter)
        styles = getSampleStyleSheet()
        story = [Paragraph("Start ERA Plan", styles["Title"]), Spacer(1, 12)]
        
        for line in text_content.split('\n'):
            if line.strip():
                story.append(Paragraph(line, styles["Normal"]))
                story.append(Spacer(1, 6))
        
        doc.build(story)
        return FileResponse(pdf_filename, filename="StartERA_Plan.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)