from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
from geda.parsers.base_parser import BaseParser

class CIBCParser(BaseParser):
    """Parser for CIBC credit card and bank account CSV files"""
    
    source_name = "CIBC"
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse CIBC CSV file format"""
        df = self.read_csv(file_path)
        
        # Determine if it's a credit card or bank account CSV
        if "Card Number" in df.columns or "Transaction Type" in df.columns:
            return self._parse_credit_card(df)
        else:
            return self._parse_bank_account(df)
    
    def _parse_credit_card(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse CIBC credit card CSV format"""
        # Expected columns: 
        # Date, Card Number, Description, Amount
        
        transactions = []
        
        for _, row in df.iterrows():
            # Parse date
            date = datetime.strptime(row["Date"], "%Y/%m/%d")
            
            # Parse amount (CIBC uses negative for expenses)
            amount = float(str(row["Amount"]).replace("$", "").replace(",", ""))
            
            # Create transaction
            card_number = row.get("Card Number", "")
            transaction = {
                "date": date,
                "amount": amount,
                "description": row["Description"],
                "original_description": row["Description"],
                "source_id": f"{card_number}_{row['Date']}_{row['Description']}"
            }
            
            transactions.append(transaction)
        
        # Process and return
        return self.process_transactions(transactions)
    
    def _parse_bank_account(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse CIBC bank account CSV format"""
        # Expected columns: 
        # Date, Description, Withdrawal, Deposit, Balance
        
        transactions = []
        
        for _, row in df.iterrows():
            # Parse date
            date = datetime.strptime(row["Date"], "%Y/%m/%d")
            
            # Parse amount
            amount = 0.0
            if pd.notna(row.get("Withdrawal", None)) and row["Withdrawal"]:
                amount = -float(str(row["Withdrawal"]).replace("$", "").replace(",", ""))
            elif pd.notna(row.get("Deposit", None)) and row["Deposit"]:
                amount = float(str(row["Deposit"]).replace("$", "").replace(",", ""))
            
            # Create transaction
            transaction = {
                "date": date,
                "amount": amount,
                "description": row["Description"],
                "original_description": row["Description"],
                "source_id": f"{row['Date']}_{row['Description']}"
            }
            
            transactions.append(transaction)
        
        # Process and return
        return self.process_transactions(transactions)