from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from geda.models import Transaction, Category
from geda.core.categorizer import TransactionCategorizer

class TransactionService:
    """Service for managing transactions"""
    
    def __init__(self, db: Session):
        self.db = db
        self.categorizer = TransactionCategorizer(db)
    
    def get_transactions(self, 
                         skip: int = 0, 
                         limit: int = 100,
                         start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None,
                         category_id: Optional[int] = None,
                         search: Optional[str] = None,
                         is_expense: Optional[bool] = None) -> List[Transaction]:
        """
        Get transactions with filtering.
        
        Args:
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            start_date: Filter by start date
            end_date: Filter by end date
            category_id: Filter by category
            search: Search in description
            is_expense: Filter by expense/income
            
        Returns:
            List of matching transactions
        """
        query = self.db.query(Transaction)
        
        # Apply filters
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        if category_id:
            query = query.filter(Transaction.category_id == category_id)
        
        if search:
            query = query.filter(Transaction.description.ilike(f"%{search}%"))
        
        if is_expense is not None:
            query = query.filter(Transaction.is_expense == is_expense)
        
        # Order by date (newest first)
        query = query.order_by(Transaction.date.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        return query.all()
    
    def get_transaction(self, transaction_id: int) -> Optional[Transaction]:
        """Get a transaction by ID"""
        return self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    def create_transaction(self, transaction_data: Dict[str, Any]) -> Transaction:
        """
        Create a new transaction.
        
        Args:
            transaction_data: Data for the transaction
            
        Returns:
            The created transaction
        """
        # Create Transaction object
        transaction = Transaction(
            date=transaction_data["date"],
            amount=transaction_data["amount"],
            description=transaction_data["description"],
            original_description=transaction_data.get("original_description"),
            is_expense=transaction_data.get("is_expense", True),
            source=transaction_data.get("source", "manual"),
            category_id=transaction_data.get("category_id"),
            # Generate a unique hash for the transaction
            hash_id=f"manual_{datetime.utcnow().timestamp()}",
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        # Auto-categorize if no category provided
        if not transaction.category_id:
            category = self.categorizer.categorize_transaction(transaction)
            if category:
                transaction.category_id = category.id
                self.db.commit()
        
        return transaction
    
    def update_transaction(self, transaction_id: int, transaction_data: Dict[str, Any]) -> Optional[Transaction]:
        """
        Update a transaction.
        
        Args:
            transaction_id: ID of the transaction to update
            transaction_data: New data for the transaction
            
        Returns:
            The updated transaction, or None if not found
        """
        transaction = self.get_transaction(transaction_id)
        if not transaction:
            return None
        
        # Update fields
        if "date" in transaction_data:
            transaction.date = transaction_data["date"]
        if "amount" in transaction_data:
            transaction.amount = transaction_data["amount"]
            transaction.is_expense = transaction.amount < 0
        if "description" in transaction_data:
            transaction.description = transaction_data["description"]
        if "category_id" in transaction_data:
            transaction.category_id = transaction_data["category_id"]
        
        # Update updated_at timestamp
        transaction.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def delete_transaction(self, transaction_id: int) -> bool:
        """
        Delete a transaction.
        
        Args:
            transaction_id: ID of the transaction to delete
            
        Returns:
            True if deleted, False if not found
        """
        transaction = self.get_transaction(transaction_id)
        if not transaction:
            return False
        
        self.db.delete(transaction)
        self.db.commit()
        
        return True
    
    def get_spending_by_category(self, 
                                 start_date: Optional[datetime] = None,
                                 end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get aggregated spending by category.
        
        Args:
            start_date: Filter by start date
            end_date: Filter by end date
            
        Returns:
            List of dictionaries with category and sum
        """
        # Default to last 30 days if not specified
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Query for expenses by category
        query = self.db.query(
            Category.id,
            Category.name,
            func.sum(Transaction.amount).label("total")
        ).join(
            Transaction,
            Transaction.category_id == Category.id
        ).filter(
            Transaction.date >= start_date,
            Transaction.date <= end_date,
            Transaction.is_expense == True
        ).group_by(
            Category.id,
            Category.name
        ).order_by(
            func.sum(Transaction.amount)
        )
        
        # Convert to dictionaries
        results = []
        for row in query.all():
            results.append({
                "category_id": row.id,
                "category_name": row.name,
                "total": abs(row.total)  # Convert to positive for UI display
            })
        
        return results
    
    def get_income_by_category(self, 
                              start_date: Optional[datetime] = None,
                              end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get aggregated income by category.
        
        Args:
            start_date: Filter by start date
            end_date: Filter by end date
            
        Returns:
            List of dictionaries with category and sum
        """
        # Default to last 30 days if not specified
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Query for income by category
        query = self.db.query(
            Category.id,
            Category.name,
            func.sum(Transaction.amount).label("total")
        ).join(
            Transaction,
            Transaction.category_id == Category.id
        ).filter(
            Transaction.date >= start_date,
            Transaction.date <= end_date,
            Transaction.is_expense == False
        ).group_by(
            Category.id,
            Category.name
        ).order_by(
            func.sum(Transaction.amount).desc()
        )
        
        # Convert to dictionaries
        results = []
        for row in query.all():
            results.append({
                "category_id": row.id,
                "category_name": row.name,
                "total": row.total
            })
        
        return results
    
    def get_spending_trends(self,
                           num_periods: int = 6,
                           period_days: int = 30) -> Dict[str, Any]:
        """
        Get spending trends over time periods.
        
        Args:
            num_periods: Number of time periods to analyze
            period_days: Number of days in each period
            
        Returns:
            Dictionary with trend data
        """
        end_date = datetime.utcnow()
        periods = []
        
        for i in range(num_periods):
            period_end = end_date - timedelta(days=i*period_days)
            period_start = end_date - timedelta(days=(i+1)*period_days)
            
            # Get total spending for this period
            total_query = self.db.query(
                func.sum(Transaction.amount)
            ).filter(
                Transaction.date >= period_start,
                Transaction.date <= period_end,
                Transaction.is_expense == True
            )
            
            total = total_query.scalar() or 0
            
            # Get top categories for this period
            category_query = self.db.query(
                Category.name,
                func.sum(Transaction.amount).label("total")
            ).join(
                Transaction,
                Transaction.category_id == Category.id
            ).filter(
                Transaction.date >= period_start,
                Transaction.date <= period_end,
                Transaction.is_expense == True
            ).group_by(
                Category.name
            ).order_by(
                func.sum(Transaction.amount)
            ).limit(3)
            
            top_categories = []
            for row in category_query.all():
                top_categories.append({
                    "name": row.name,
                    "total": abs(row.total)
                })
            
            periods.append({
                "start_date": period_start,
                "end_date": period_end,
                "total": abs(total),
                "top_categories": top_categories
            })
        
        # Return in chronological order
        return {"periods": list(reversed(periods))}