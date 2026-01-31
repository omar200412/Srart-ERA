from sqlalchemy import Column, Integer, String, JSON
from .database import Base

# Veritabanında oluşacak "business_plans" tablosu
class BusinessPlan(Base):
    __tablename__ = "business_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)       
    full_plan_json = Column(JSON) 