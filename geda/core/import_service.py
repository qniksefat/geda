import os
import uuid
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from geda.models import Transaction
from geda.parsers import ParserFactory
from geda.core.categorizer import TransactionCategorizer

class ImportService:
    """Service for importing transactions from files"""
    
    def __init__(self, db: Session):
        self.db = db
        self.categorizer = TransactionCategorizer(db)
    
    def preview_import(self, file_path: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Parse a file and return the transactions for preview, along with potential duplicates.
        
        Args:
            file_path: Path to the file to import
            
        Returns:
            Tuple of (transactions, duplicates)
        """
        # Get parser based on file type
        parser = ParserFactory.get_parser(file_path)
        
        # Parse the file
        transactions = parser.parse(file_path)
        
        # Check for potential duplicates
        duplicates = []
        for transaction in transactions:
            # Check if this hash already exists in the database
            existing = self.db.query(Transaction).filter(
                Transaction.hash_id == transaction["hash_id"]
            ).first()
            
            if existing:
                # Add to duplicates list
                duplicates.append(transaction)
        
        # Generate import_id
        import_id = str(uuid.uuid4())
        
        # Add import_id to each transaction
        for transaction in transactions:
            transaction["import_id"] = import_id
        
        return transactions, duplicates, import_id
    
    def import_transactions(self, 
                            transactions: List[Dict[str, Any]], 
                            auto_categorize: bool = True) -> List[Transaction]:
        """
        Import transactions into the database.
        
        Args:
            transactions: List of transaction dictionaries to import
            auto_categorize: Whether to automatically categorize transactions
            
        Returns:
            List of imported Transaction objects
        """
        # Create Transaction objects
        db_transactions = []
        for transaction_data in transactions:
            transaction = Transaction(
                date=transaction_data["date"],
                amount=transaction_data["amount"],
                description=transaction_data["description"],
                original_description=transaction_data.get("original_description"),
                is_expense=transaction_data["is_expense"],
                source=transaction_data["source"],
                import_id=transaction_data["import_id"],
                source_id=transaction_data.get("source_id"),
                hash_id=transaction_data["hash_id"],
            )
            db_transactions.append(transaction)
            self.db.add(transaction)
        
        # Commit to get IDs
        self.db.commit()
        
        # Auto-categorize if requested
        if auto_categorize:
            self.categorizer.batch_categorize(db_transactions)
            self.db.commit()
        
        return db_transactions
    
    def import_from_file(self, file_path: str, auto_categorize: bool = True) -> List[Transaction]:
        """
        Import transactions directly from a file.
        
        Args:
            file_path: Path to the file to import
            auto_categorize: Whether to automatically categorize transactions
            
        Returns:
            List of imported Transaction objects
        """
        # Get parser based on file type
        parser = ParserFactory.get_parser(file_path)
        
        # Parse the file
        transactions = parser.parse(file_path)
        
        # Generate import_id
        import_id = str(uuid.uuid4())
        
        # Add import_id to each transaction
        for transaction in transactions:
            transaction["import_id"] = import_id
        
        # Filter out duplicates
        non_duplicates = []
        for transaction in transactions:
            # Check if this hash already exists in the database
            existing = self.db.query(Transaction).filter(
                Transaction.hash_id == transaction["hash_id"]
            ).first()
            
            if not existing:
                non_duplicates.append(transaction)
        
        # Import non-duplicate transactions
        return self.import_transactions(non_duplicates, auto_categorize)