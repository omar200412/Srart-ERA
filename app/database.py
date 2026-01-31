from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Veritabanı dosyasının adı
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# Motoru oluşturuyoruz 
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Oturum oluşturucu
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Modellerin türeyeceği temel sınıf
Base = declarative_base()