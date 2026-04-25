from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=50)
    note: str = Field(default="", max_length=300)
    type: Literal["expense", "income"] = "expense"


class ExpenseRecord(ExpenseCreate):
    id: str
    user_id: str
    created_at: datetime


class ExpenseSummary(BaseModel):
    total_expense: float
    total_income: float
    balance: float
