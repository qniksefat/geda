from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import pandas as pd
import hashlib
import json
from datetime import datetime

class BaseParser(ABC):
    """Base class for all parsers"""
    
    source_name: str  # Name of the source (e.g., "RBC", "AMEX")
    
    @abstractmethod
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse the file and return a list of transaction dictionaries.
        
        Each transaction should have:
        - date: datetime
        - amount: float (positive for income, negative for expense)
        - description: str
        - original_description: str (optional)
        - source_id: str (optional, ID from the source)
        """
        pass
    
    def generate_hash(self, transaction: Dict[str, Any]) -> str:
        """
        Generate a hash for the transaction to detect duplicates.
        
        The hash is based on:
        - date (truncated to day)
        - amount (rounded to 2 decimal places)
        - description
        - source
        """
        # Extract and format key fields
        date_str = transaction["date"].strftime("%Y-%m-%d")
        amount_str = f"{float(transaction['amount']):.2f}"
        source = self.source_name
        
        # Combine fields into a string
        hash_str = f"{date_str}|{amount_str}|{transaction['description']}|{source}"
        
        # Generate hash
        hash_value = hashlib.sha256(hash_str.encode()).hexdigest()
        
        return hash_value
    
    def read_csv(self, file_path: str) -> pd.DataFrame:
        """Read a CSV file into a pandas DataFrame"""
        return pd.read_csv(file_path, encoding="utf-8")
    
    def process_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process transactions and add common fields.
        
        This includes:
        - Adding hash_id
        - Adding source name
        - Setting is_expense flag
        """
        for transaction in transactions:
            # Set source
            transaction["source"] = self.source_name
            
            # Set expense flag based on amount
            transaction["is_expense"] = transaction["amount"] < 0
            
            # Generate hash ID
            transaction["hash_id"] = self.generate_hash(transaction)
            
        return transactions