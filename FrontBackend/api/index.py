import os
import sqlite3
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.colors import HexColor

# -------------------- ENV --------------------
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ MODEL: Gemini 2.5 Flash
MODEL_NAME = "gemini-2.5-flash"

try:
    if API_KEY:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)
    else:
        model = None
except Exception as e:
    model = None

# -------------------- APP --------------------
# Vercel'de docs rotaları çakışma yapmasın diye kapatıyoruz veya farklı yola alıyoruz
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DB --------------------
def get_db():
    # Vercel'de kalıcı veri için Postgres önerilir
    if DATABASE_URL:
        try:
            return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        except:
            pass
    
    # SQLite kullanıyorsak Vercel'de SADECE /tmp klasörüne yazabiliriz
    # UYARI: /tmp klasörü her deployda sıfırlanır!
    db_path = "/tmp/chatbot.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def ph():
    return "%s" if DATABASE_URL else "?"

def init_db():
    try:
        conn = get_db()
        cur = conn.cursor()

        # Users Tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """ if DATABASE_URL else """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """)

        # Chat History Tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                role TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """ if DATABASE_URL else """
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

# Uygulama başlarken DB'yi hazırla
init_db()

# -------------------- MODELS --------------------
class UserAuth(BaseModel):
    email: str
    password: str

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

# -------------------- ROUTES --------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "backend": "Vercel Python Runtime"}

@app.post("/api/register")
def register(user: UserAuth):
    conn = get_db()
    cur = conn.cursor()
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    try:
        cur.execute(f"INSERT INTO users (email, password) VALUES ({ph()}, {ph()})", (user.email, hashed))
        conn.commit()
        return {"message": "ok"}
    except:
        raise HTTPException(400, "Email already exists")
    finally:
        conn.close()

@app.post("/api/login")
def login(user: UserAuth):
    conn = get_db()
    cur = conn.cursor()
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    try:
        cur.execute(f"SELECT email FROM users WHERE email={ph()} AND password={ph()}", (user.email, hashed))
        row = cur.fetchone()
    except:
        row = None
    finally:
        conn.close()

    if not row:
        raise HTTPException(401, "Invalid credentials")

    return {"token": f"user-{user.email}", "email": user.email}

@app.post("/api/chat")
def chat(req: ChatRequest):
    if not model: return {"reply": "API Key Missing or Model Error"}
    
    prompt = (req.system_prompt or "") + "\n\nUser: " + req.message
    
    try:
        response = model.generate_content(prompt)
        reply = response.text
    except Exception as e:
        reply = "⚠️ AI service temporarily unavailable."

    # Chat loglama (Hata verirse akışı bozmasın)
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"INSERT INTO chat_history (role, message) VALUES ({ph()}, {ph()})", ("user", req.message))
        cur.execute(f"INSERT INTO chat_history (role, message) VALUES ({ph()}, {ph()})", ("bot", reply))
        conn.commit()
        conn.close()
    except:
        pass

    return {"reply": reply}

@app.post("/api/generate_plan")
def generate_plan(req: BusinessPlanRequest):
    if not model: raise HTTPException(503, "API Key Missing")
    
    prompt = f"""
You are a professional business consultant named Start ERA AI.
LANGUAGE: {req.language}

Details:
- Idea: {req.idea}
- Capital: {req.capital}
- Skills: {req.skills}
- Strategy: {req.strategy}
- Management: {req.management}

OUTPUT: A structured business plan (Executive Summary, Market Analysis, Financial Plan).
No markdown symbols like **.
"""
    try:
        text = model.generate_content(prompt).text.replace("*", "").replace("#", "")
        return JSONResponse(content={"plan": text})
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/create_pdf")
def create_pdf(req: PDFRequest):
    # Vercel'de yazılabilir tek alan /tmp klasörüdür
    pdf_file = "/tmp/StartERA_Plan.pdf"
    
    try:
        doc = SimpleDocTemplate(pdf_file, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        brand_color = HexColor("#1e40af") 
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=24, spaceAfter=30, textColor=brand_color, alignment=TA_CENTER)
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, spaceBefore=20, textColor=brand_color)
        body_style = ParagraphStyle('CustomBody', parent=styles['Normal'], fontName='Helvetica', fontSize=11, leading=15, alignment=TA_JUSTIFY, spaceAfter=10)

        story = []
        story.append(Paragraph("Start ERA", title_style))
        story.append(Paragraph("Professional Business Plan", styles["Heading3"]))
        story.append(Spacer(1, 30))
        
        for line in req.text.split("\n"):
            line = line.strip()
            if not line: continue
            if (len(line) < 60 and line.isupper()) or (len(line) < 50 and line.endswith(":")):
                story.append(Paragraph(line, heading_style))
            else:
                story.append(Paragraph(line, body_style))
        
        story.append(Spacer(1, 40))
        story.append(Paragraph("© 2026 Start ERA", styles["Italic"]))
        
        doc.build(story)
        return FileResponse(pdf_file, filename="StartERA_Plan.pdf", media_type="application/pdf")
    except Exception as e:
        raise HTTPException(500, f"PDF Error: {str(e)}")