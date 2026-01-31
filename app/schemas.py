from pydantic import BaseModel
from typing import List, Optional

class PlanRequest(BaseModel):
    idea: str
    capital: str
    skills: str
    strategy: str
    management: str

class PlanResponse(BaseModel):
    title: str
    executive_summary: str
    mission_statement: str
    vision_statement: str
    market_analysis: str
    business_model: str
    marketing_strategy: List[str]
    operations_plan: str
    financial_plan: str
    funding_plan: str
    risk_analysis: str
    disclaimer: str
    pdf_url: Optional[str] = None