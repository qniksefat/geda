from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
from geda.parsers.base_parser import BaseParser

class RBCParser(BaseParser):
    """Parser for RBC credit card and bank account CSV files"""
    
    source_name = "RBC"
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse RBC CSV file format"""
        df = self.read_csv(file_path)
        
        # Determine if it's a credit card or bank account CSV
        if "Account Type" in df.columns and "Card Number" in df.columns:
            return self._parse_credit_card(df)
        else:
            return self._parse_bank_account(df)
    
    def _parse_credit_card(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse RBC credit card CSV format"""
        # Expected columns: 
        # Transaction Date, Posting Date, Card Number, Description, Category, Debit, Credit
        
        transactions = []
        
        for _, row in df.iterrows():
            # Parse date
            date = datetime.strptime(row["Transaction Date"], "%m/%d/%Y")
            
            # Parse amount
            amount = 0.0
            if pd.notna(row.get("Debit", None)) and row["Debit"]:
                amount = -float(row["Debit"].replace("$", "").replace(",", ""))
            elif pd.notna(row.get("Credit", None)) and row["Credit"]:
                amount = float(row["Credit"].replace("$", "").replace(",", ""))
            
            # Create transaction
            transaction = {
                "date": date,
                "amount": amount,
                "description": row["Description"],
                "original_description": row["Description"],
                "source_id": f"{row['Card Number']}_{row['Transaction Date']}_{row['Description']}"
            }
            
            transactions.append(transaction)
        
        # Process and return
        return self.process_transactions(transactions)
    
    def _parse_bank_account(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse RBC bank account CSV format"""
        # Expected columns: 
        # Date, Transaction, Name, Memo, Amount
        
        transactions = []
        
        for _, row in df.iterrows():
            # Parse date
            date = datetime.strptime(row["Date"], "%m/%d/%Y")
            
            # Parse amount
            amount = float(str(row["Amount"]).replace("$", "").replace(",", ""))
            
            # Create description
            description = row["Name"]
            if pd.notna(row.get("Memo", None)) and row["Memo"]:
                description += f" - {row['Memo']}"
            
            # Create transaction
            transaction = {
                "date": date,
                "amount": amount,
                "description": description,
                "original_description": description,
                "source_id": f"{row['Date']}_{row['Transaction']}_{row['Name']}"
            }
            
            transactions.append(transaction)
        
        # Process and return
        return self.process_transactions(transactions)