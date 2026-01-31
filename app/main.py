import os
import sqlite3
import hashlib
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# PDF Kütüphaneleri
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# .env dosyasını yükle
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("UYARI: .env dosyası bulunamadı veya içi boş! Lütfen oluşturun.")

# --- MODEL AYARI (GEMINI 2.5 FLASH - Hızlı ve Ücretsiz) ---
try:
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash") 
        print("✅ Gemini 2.5 FLASH Modeli Başarıyla Yüklendi!")
except Exception as e:
    print(f"Model Hatası: {e}")

app = FastAPI()

# CORS İzinleri (Frontend bağlantısı için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Güvenlik için canlıda kendi domainini yaz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- VERİTABANI KURULUMU ---
def init_db():
    conn = sqlite3.connect("chatbot.db")
    cursor = conn.cursor()
    # Kullanıcılar
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )
    """)
    # Chat Geçmişi
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# --- VERİ MODELLERİ ---
class UserAuth(BaseModel):
    email: str
    password: str

class BusinessPlanRequest(BaseModel):
    business_idea: str
    language: str = "tr"

class ChatRequest(BaseModel):
    message: str
    language: str = "tr"

# --- 1. LOGIN & REGISTER ---
@app.post("/register")
def register(user: UserAuth):
    try:
        conn = sqlite3.connect("chatbot.db")
        cursor = conn.cursor()
        hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (user.email, hashed_pw))
        conn.commit()
        conn.close()
        return {"message": "Kayıt Başarılı"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kullanılıyor.")

@app.post("/login")
def login(user: UserAuth):
    conn = sqlite3.connect("chatbot.db")
    cursor = conn.cursor()
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    cursor.execute("SELECT * FROM users WHERE email=? AND password=?", (user.email, hashed_pw))
    user_data = cursor.fetchone()
    conn.close()
    
    if user_data:
        # Basit bir token simülasyonu
        return {"token": f"user-token-{user.email}", "message": "Giriş Başarılı"}
    else:
        raise HTTPException(status_code=401, detail="Hatalı E-posta veya Şifre")

# --- 2. CHATBOT ---
@app.post("/chat")
def chat(req: ChatRequest):
    try:
        # Mesajı Kaydet
        conn = sqlite3.connect("chatbot.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO chat_history (role, message) VALUES (?, ?)", ("user", req.message))
        conn.commit()

        # AI Cevabı
        if api_key:
            system_instruction = f"""
            Sen Start ERA platformunun asistanısın.
            Model: Gemini 2.5 Flash.
            Dil: {req.language}.
            Görevin: Kullanıcıya girişimcilik, iş planları ve yazılım konusunda hızlı ve akıllı destek olmak.
            Soru: {req.message}
            """
            response = model.generate_content(system_instruction)
            reply = response.text
        else:
            reply = "API Anahtarı eksik! Lütfen .env dosyasına ekleyin."

        # Cevabı Kaydet
        cursor.execute("INSERT INTO chat_history (role, message) VALUES (?, ?)", ("bot", reply))
        conn.commit()
        conn.close()
        return {"reply": reply}
    except Exception as e:
        print(f"Chat Hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
def history():
    conn = sqlite3.connect("chatbot.db")
    cursor = conn.cursor()
    cursor.execute("SELECT role, message FROM chat_history ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"text": msg, "isBot": (role == "bot")} for role, msg in rows]

# --- 3. PDF GENERATOR ---
@app.post("/generate_plan")
def generate_plan(req: BusinessPlanRequest):
    try:
        if not api_key:
            raise HTTPException(status_code=500, detail="API Key eksik")
            
        prompt = f"""
        Aşağıdaki iş fikri için profesyonel bir iş planı hazırla.
        Dil: {req.language}.
        İş Fikri: {req.business_idea}.
        Lütfen başlıkları ve maddeleri net bir şekilde ayır.
        """
        response = model.generate_content(prompt)
        text_content = response.text.replace("*", "").replace("#", "")
        
        pdf_filename = "StartERA_Plan.pdf"
        document = SimpleDocTemplate(pdf_filename, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Başlık
        story.append(Paragraph(f"Start ERA - İş Planı", styles["Title"]))
        story.append(Spacer(1, 12))
        
        # İçerik
        for line in text_content.split('\n'):
            if line.strip():
                story.append(Paragraph(line, styles["Normal"]))
                story.append(Spacer(1, 6))

        document.build(story)
        
        return FileResponse(pdf_filename, media_type='application/pdf', filename="StartERA_Plan.pdf")
    except Exception as e:
        print(f"PDF Hatası: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)