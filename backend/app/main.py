from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import firestore

from .config import get_settings
from .dependencies import get_current_user
from .firebase import get_firestore_client
from .schemas import ExpenseCreate, ExpenseRecord, ExpenseSummary, UserProfile

settings = get_settings()

api = FastAPI(title=settings.app_name, version="1.0.0")

app = CORSMiddleware(
    api,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.get("/")
def root():
    return {"message": "Finance Manager API is running."}


@api.get("/health")
def health():
    return {"status": "ok"}


@api.get("/auth/me", response_model=UserProfile)
def auth_me(current_user: UserProfile = Depends(get_current_user)):
    return current_user


@api.post("/auth/verify", response_model=UserProfile)
def auth_verify(current_user: UserProfile = Depends(get_current_user)):
    return current_user


@api.post("/expenses", response_model=ExpenseRecord, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    db = get_firestore_client()
    doc_ref = (
        db.collection("users")
        .document(current_user.uid)
        .collection("expenses")
        .document()
    )

    created_at = datetime.now(timezone.utc)
    data = {
        "title": payload.title,
        "amount": payload.amount,
        "category": payload.category,
        "note": payload.note,
        "type": payload.type,
        "user_id": current_user.uid,
        "created_at": created_at,
    }
    doc_ref.set(data)

    return ExpenseRecord(id=doc_ref.id, created_at=created_at, **data)


@api.get("/expenses", response_model=list[ExpenseRecord])
def list_expenses(current_user: UserProfile = Depends(get_current_user)):
    db = get_firestore_client()
    docs = (
        db.collection("users")
        .document(current_user.uid)
        .collection("expenses")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .stream()
    )

    expenses = []
    for doc in docs:
        item = doc.to_dict()
        expenses.append(
            ExpenseRecord(
                id=doc.id,
                title=item["title"],
                amount=item["amount"],
                category=item["category"],
                note=item.get("note", ""),
                type=item.get("type", "expense"),
                user_id=item["user_id"],
                created_at=item["created_at"],
            )
        )

    return expenses


@api.get("/expenses/summary", response_model=ExpenseSummary)
def expenses_summary(current_user: UserProfile = Depends(get_current_user)):
    expenses = list_expenses(current_user)
    total_expense = sum(item.amount for item in expenses if item.type == "expense")
    total_income = sum(item.amount for item in expenses if item.type == "income")

    return ExpenseSummary(
        total_expense=total_expense,
        total_income=total_income,
        balance=total_income - total_expense,
    )
