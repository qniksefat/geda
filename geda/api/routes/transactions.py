from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date

from geda.api.schemas import Transaction, TransactionCreate, TransactionWithCategory
from geda.core import TransactionService
from geda.db import get_db

router = APIRouter()

@router.get("/", response_model=List[TransactionWithCategory])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    is_expense: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get a list of transactions with optional filtering.
    """
    # Convert date to datetime if provided
    start_datetime = datetime(start_date.year, start_date.month, start_date.day) if start_date else None
    end_datetime = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59) if end_date else None
    
    service = TransactionService(db)
    transactions = service.get_transactions(
        skip=skip,
        limit=limit,
        start_date=start_datetime,
        end_date=end_datetime,
        category_id=category_id,
        search=search,
        is_expense=is_expense
    )
    return transactions

@router.get("/{transaction_id}", response_model=TransactionWithCategory)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Get a specific transaction by ID.
    """
    service = TransactionService(db)
    transaction = service.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.post("/", response_model=Transaction)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Create a new transaction.
    """
    service = TransactionService(db)
    return service.create_transaction(transaction.dict())

@router.put("/{transaction_id}", response_model=Transaction)
def update_transaction(
    transaction_id: int, 
    transaction: TransactionCreate, 
    db: Session = Depends(get_db)
):
    """
    Update an existing transaction.
    """
    service = TransactionService(db)
    updated = service.update_transaction(transaction_id, transaction.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated

@router.delete("/{transaction_id}", response_model=bool)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Delete a transaction.
    """
    service = TransactionService(db)
    success = service.delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return True

@router.get("/stats/by-category", response_model=List[dict])
def get_spending_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Get aggregated spending by category.
    """
    # Convert date to datetime if provided
    start_datetime = datetime(start_date.year, start_date.month, start_date.day) if start_date else None
    end_datetime = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59) if end_date else None
    
    service = TransactionService(db)
    return service.get_spending_by_category(
        start_date=start_datetime,
        end_date=end_datetime
    )

@router.get("/stats/income-by-category", response_model=List[dict])
def get_income_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Get aggregated income by category.
    """
    # Convert date to datetime if provided
    start_datetime = datetime(start_date.year, start_date.month, start_date.day) if start_date else None
    end_datetime = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59) if end_date else None
    
    service = TransactionService(db)
    return service.get_income_by_category(
        start_date=start_datetime,
        end_date=end_datetime
    )

@router.get("/stats/trends", response_model=dict)
def get_spending_trends(
    num_periods: int = Query(6, gt=0, le=12),
    period_days: int = Query(30, gt=0, le=365),
    db: Session = Depends(get_db)
):
    """
    Get spending trends over time periods.
    """
    service = TransactionService(db)
    return service.get_spending_trends(
        num_periods=num_periods,
        period_days=period_days
    )