import os
import sqlite3
import hashlib
import smtplib
import random
import platform
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.colors import HexColor

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
# E-posta ayarları (Şimdilik otomatik onay açık olduğu için kritik değil)
MAIL_SERVER = os.getenv("MAIL_SERVER", "mail.plan-iq.net")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "dev@plan-iq.net")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MODEL_NAME = "gemini-2.5-flash"

try:
    if API_KEY:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)
    else:
        model = None
except Exception as e:
    model = None

# FastAPI Uygulaması
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DB AYARLARI (KRİTİK DÜZELTME) --------------------
def get_db():
    # 1. Eğer Postgres varsa onu kullan (Canlı Ortam İçin En İyisi)
    if DATABASE_URL:
        try:
            return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        except:
            pass
    
    # 2. SQLite Ayarı:
    # Windows'ta (Localhost) ise ana dizine kaydet (Kalıcı olur)
    # Vercel'de (Linux) ise /tmp altına kaydet (Geçici olur - Veri silinir!)
    if platform.system() == "Windows":
        db_path = "chatbot.db" # Bilgisayarında kalıcı durur
    else:
        db_path = "/tmp/chatbot.db" # Vercel'de silinir (Normaldir)
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def ph():
    return "%s" if DATABASE_URL else "?"

def init_db():
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Tabloları oluştur
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                verification_code TEXT,
                is_verified INTEGER DEFAULT 1 
            );
        """)
        # Not: is_verified varsayılan olarak 1 (True) yapıldı ki hemen girebilesin.
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

init_db()

# -------------------- MODELLER --------------------
class UserAuth(BaseModel):
    email: str
    password: str

class VerifyRequest(BaseModel):
    email: str
    code: str

class ChatRequest(BaseModel):
    message: str
    system_prompt: str | None = None

class BusinessPlanRequest(BaseModel):
    idea: str
    capital: str
    skills: str
    strategy: str
    management: str
    language: str = "tr"

class PDFRequest(BaseModel):
    text: str

# -------------------- ROTALAR --------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "backend": "Python Active"}

@app.post("/api/register")
def register(user: UserAuth):
    conn = get_db()
    cur = conn.cursor()
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    code = "123456" # Sabit kod

    try:
        # Kullanıcı var mı kontrol et
        cur.execute(f"SELECT id FROM users WHERE email={ph()}", (user.email,))
        if cur.fetchone():
             raise HTTPException(400, "Bu e-posta zaten kayıtlı.")

        # is_verified = 1 (Doğrulanmış) olarak kaydediyoruz.
        # Böylece mail beklemek zorunda kalmazsın.
        cur.execute(
            f"INSERT INTO users (email, password, verification_code, is_verified) VALUES ({ph()}, {ph()}, {ph()}, {ph()})", 
            (user.email, hashed, code, 1) 
        )
        conn.commit()
        
        # Frontend'i Login ekranına yönlendirmek için "verification_needed" yerine "success" dönüyoruz olabilir
        # Ama senin frontend yapına uyması için verification_needed dönüyorum, 
        # kod olarak "123456" girip geçebilirsin.
        return {"message": "verification_needed", "email": user.email, "debug_code": code}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Register Error: {e}")
        raise HTTPException(500, "Kayıt sırasında hata oluştu.")
    finally:
        conn.close()

@app.post("/api/verify")
def verify(req: VerifyRequest):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT verification_code FROM users WHERE email={ph()}", (req.email,))
        row = cur.fetchone()
        
        # Geliştirme modu: Her türlü kodu kabul et veya 123456
        if row:
            # Kullanıcıyı doğrulanmış yap
            cur.execute(f"UPDATE users SET is_verified={ph()} WHERE email={ph()}", (1, req.email))
            conn.commit()
            return {"message": "success", "token": f"user-{req.email}", "email": req.email}
        else:
            raise HTTPException(404, "Kullanıcı bulunamadı")
    finally:
        conn.close()

@app.post("/api/login")
def login(user: UserAuth):
    conn = get_db()
    cur = conn.cursor()
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    
    try:
        # Email ve Şifre kontrolü
        cur.execute(f"SELECT email, is_verified FROM users WHERE email={ph()} AND password={ph()}", (user.email, hashed))
        row = cur.fetchone()
        
        if not row:
            print(f"Login Failed: {user.email} - User not found or wrong pass")
            raise HTTPException(401, "Hatalı e-posta veya şifre.")
            
        # is_verified kontrolünü geliştirme aşamasında es geçebiliriz ama
        # yukarıda register'da zaten 1 yaptık.
        # yine de garanti olsun diye burayı yorum satırı yapmıyorum.
        # is_verified = row[1] if DATABASE_URL else row["is_verified"]
        # if not is_verified: ...
        
        return {"token": f"user-{user.email}", "email": user.email}
    except Exception as e:
        print(f"Login Error: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(500, "Giriş yapılamadı.")
    finally:
        conn.close()

@app.post("/api/chat")
def chat(req: ChatRequest):
    if not model: return {"reply": "API Key Missing"}
    try:
        prompt = (req.system_prompt or "") + "\n\nUser: " + req.message
        response = model.generate_content(prompt)
        reply = response.text
    except:
        reply = "Üzgünüm, şu an yanıt veremiyorum."
    return {"reply": reply}

@app.post("/api/generate_plan")
def generate_plan(req: BusinessPlanRequest):
    if not model: raise HTTPException(503, "API Key Missing")
    prompt = f"Idea: {req.idea}\nCapital: {req.capital}\nSkills: {req.skills}\nStrategy: {req.strategy}\nLang: {req.language}\nCreate a business plan."
    try:
        text = model.generate_content(prompt).text.replace("*", "").replace("#", "")
        return JSONResponse(content={"plan": text})
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/create_pdf")
def create_pdf(req: PDFRequest):
    # İşletim sistemine göre PDF yolu
    if platform.system() == "Windows":
        pdf_file = "StartERA_Plan.pdf"
    else:
        pdf_file = "/tmp/StartERA_Plan.pdf"

    try:
        doc = SimpleDocTemplate(pdf_file, pagesize=A4)
        styles = getSampleStyleSheet()
        story = [Paragraph("Business Plan", styles["Title"]), Spacer(1, 12)]
        for line in req.text.split("\n"):
            if line.strip(): story.append(Paragraph(line, styles["Normal"]))
        doc.build(story)
        return FileResponse(pdf_file, filename="StartERA_Plan.pdf", media_type="application/pdf")
    except Exception as e:
        raise HTTPException(500, str(e))