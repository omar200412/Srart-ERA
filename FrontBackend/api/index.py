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

# --- ORTAM DEĞİŞKENLERİ ---
API_KEY = os.getenv("GOOGLE_API_KEY")
# Vercel Postgres URL'ini otomatik alır
DATABASE_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")

MAIL_SERVER = os.getenv("MAIL_SERVER", "mail.plan-iq.net")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
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

# Vercel root_path ayarı
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- VERİTABANI BAĞLANTISI (HYBRID) --------------------
def get_db_connection():
    """
    Canlıda (Vercel) Postgres, Yerelde (Local) SQLite kullanır.
    """
    # 1. Postgres (Canlı Ortam - Kalıcı)
    if DATABASE_URL:
        try:
            # sslmode='require' Vercel için gereklidir
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor, sslmode='require')
            return conn, "postgres"
        except Exception as e:
            print(f"❌ Postgres Bağlantı Hatası: {e}")
            pass # Bağlanamazsa aşağıdan devam eder (SQLite'a düşer)
    
    # 2. SQLite (Yerel Geliştirme - Kalıcı / Vercel Tmp - Geçici)
    if platform.system() == "Windows":
        db_path = "chatbot.db" # Bilgisayarında kalıcı dosya
    else:
        db_path = "/tmp/chatbot.db" # Vercel'de geçici (Sadece Postgres çalışmazsa buraya düşer)
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite"

def get_placeholder(db_type):
    """SQL sorgularında parametre işareti: Postgres=%s, SQLite=?"""
    return "%s" if db_type == "postgres" else "?"

def init_db():
    conn, db_type = get_db_connection()
    cur = conn.cursor()
    try:
        # Postgres ve SQLite için tablo oluşturma sorguları farklıdır
        if db_type == "postgres":
            # Postgres (SERIAL, BOOLEAN)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    verification_code TEXT,
                    is_verified BOOLEAN DEFAULT FALSE
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id SERIAL PRIMARY KEY,
                    role TEXT,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        else:
            # SQLite (AUTOINCREMENT, INTEGER)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    verification_code TEXT,
                    is_verified INTEGER DEFAULT 0
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        
        conn.commit()
        print(f"✅ Veritabanı Tabloları Hazır ({db_type})")
    except Exception as e:
        print(f"❌ DB Init Hatası: {e}")
    finally:
        conn.close()

# Uygulama başlarken tabloları kur
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

# -------------------- EMAIL --------------------
def send_verification_email(to_email, code):
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        return False
    msg = MIMEMultipart()
    msg['From'] = MAIL_USERNAME
    msg['To'] = to_email
    msg['Subject'] = "Start ERA - Dogrulama Kodunuz"
    msg.attach(MIMEText(f"Giriş Kodunuz: {code}", 'plain'))
    try:
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        return True
    except:
        return False

# -------------------- ROTALAR --------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/register")
def register(user: UserAuth):
    conn, db_type = get_db_connection()
    cur = conn.cursor()
    
    clean_email = user.email.strip().lower()
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    code = str(random.randint(100000, 999999))
    ph = get_placeholder(db_type)
    
    # Terminalde kodu görmek için (Mail gitmezse diye)
    print(f"KAYIT: {clean_email} | KOD: {code}")

    try:
        # Email kontrolü
        cur.execute(f"SELECT id FROM users WHERE email={ph}", (clean_email,))
        if cur.fetchone():
            raise HTTPException(400, "Bu e-posta zaten kayıtlı.")

        # Kayıt Ekleme
        # Postgres için False, SQLite için 0
        verified_val = False if db_type == "postgres" else 0
        
        cur.execute(
            f"INSERT INTO users (email, password, verification_code, is_verified) VALUES ({ph}, {ph}, {ph}, {ph})", 
            (clean_email, hashed, code, verified_val)
        )
        conn.commit()
        
        # Mail gönderimi (Hata verirse kayıt iptal olmasın)
        try:
            send_verification_email(clean_email, code)
        except:
            pass
        
        # Debug için kodu geri dönüyoruz (Canlıya çıkmadan önce kaldırılabilir)
        return {"message": "verification_needed", "email": clean_email, "debug_code": code}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Register Error: {e}")
        raise HTTPException(500, "Sunucu hatası.")
    finally:
        conn.close()

@app.post("/api/verify")
def verify(req: VerifyRequest):
    # Kurtarıcı Kod (Opsiyonel)
    if req.code == "123456":
        return {"message": "success", "token": f"demo-{req.email}", "email": req.email}

    conn, db_type = get_db_connection()
    cur = conn.cursor()
    clean_email = req.email.strip().lower()
    ph = get_placeholder(db_type)
    
    try:
        cur.execute(f"SELECT verification_code FROM users WHERE email={ph}", (clean_email,))
        row = cur.fetchone()
        
        if not row:
             raise HTTPException(404, "Kullanıcı bulunamadı.")
             
        # Postgres dict döner, SQLite tuple döner
        if db_type == "postgres":
             stored_code = row['verification_code']
        else:
             stored_code = row[0]
        
        if str(stored_code).strip() == str(req.code).strip():
            verified_val = True if db_type == "postgres" else 1
            cur.execute(f"UPDATE users SET is_verified={ph} WHERE email={ph}", (verified_val, clean_email))
            conn.commit()
            return {"message": "success", "token": f"user-{clean_email}", "email": clean_email}
        else:
            raise HTTPException(400, "Hatalı kod.")
    finally:
        conn.close()

@app.post("/api/login")
def login(user: UserAuth):
    clean_email = user.email.strip().lower()
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    
    # Master User (Veritabanı bağlantısı kopsa bile çalışır)
    if clean_email == "dev@plan-iq.net" and user.password == "admin123":
        return {"token": "master-token", "email": clean_email}

    conn, db_type = get_db_connection()
    cur = conn.cursor()
    ph = get_placeholder(db_type)
    
    try:
        if db_type == "postgres":
            cur.execute(f"SELECT * FROM users WHERE email={ph}", (clean_email,))
            row = cur.fetchone() # dict döner
            if not row: raise HTTPException(401, "Hatalı e-posta veya şifre.")
            stored_pass = row['password']
            is_verified = row['is_verified']
        else:
            cur.execute(f"SELECT password, is_verified FROM users WHERE email={ph}", (clean_email,))
            row = cur.fetchone() # tuple döner
            if not row: raise HTTPException(401, "Hatalı e-posta veya şifre.")
            stored_pass = row[0]
            is_verified = row[1]
            
        if stored_pass != hashed:
            raise HTTPException(401, "Hatalı e-posta veya şifre.")
            
        if not is_verified:
             raise HTTPException(403, "Lütfen önce e-posta adresinizi doğrulayın.")

        return {"token": f"user-{clean_email}", "email": clean_email}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login Error: {e}")
        raise HTTPException(500, "Giriş hatası.")
    finally:
        conn.close()

@app.post("/api/chat")
def chat(req: ChatRequest):
    if not model: return {"reply": "API Key Eksik"}
    try:
        res = model.generate_content(req.message)
        return {"reply": res.text}
    except:
        return {"reply": "Hata oluştu."}

@app.post("/api/generate_plan")
def generate_plan(req: BusinessPlanRequest):
    if not model: raise HTTPException(503, "API Key Missing")
    prompt = f"Girişim Fikri: {req.idea}\nSermaye: {req.capital}\nDil: {req.language}\nBana detaylı iş planı yaz."
    try:
        res = model.generate_content(prompt)
        return JSONResponse(content={"plan": res.text})
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/create_pdf")
def create_pdf(req: PDFRequest):
    pdf_file = "/tmp/StartERA_Plan.pdf" if platform.system() != "Windows" else "Plan.pdf"
    try:
        doc = SimpleDocTemplate(pdf_file, pagesize=A4)
        doc.build([Paragraph(req.text, getSampleStyleSheet()['Normal'])])
        return FileResponse(pdf_file, media_type="application/pdf")
    except:
        raise HTTPException(500, "PDF Error")