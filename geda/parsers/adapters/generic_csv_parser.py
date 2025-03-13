from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
from geda.parsers.base_parser import BaseParser

class GenericCSVParser(BaseParser):
    """Parser for generic CSV files with Date,Description,Amount format"""
    
    source_name = "Generic CSV"
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse generic CSV file format"""
        df = self.read_csv(file_path)
        
        # Verify required columns exist
        required_columns = ["Date", "Description", "Amount"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
        
        transactions = []
        
        for _, row in df.iterrows():
            # Parse date - try multiple formats
            try:
                date = datetime.strptime(row["Date"], "%Y-%m-%d")
            except ValueError:
                try:
                    date = datetime.strptime(row["Date"], "%m/%d/%Y")
                except ValueError:
                    raise ValueError(f"Unsupported date format: {row['Date']}")
            
            # Parse amount
            amount = float(str(row["Amount"]).replace("$", "").replace(",", ""))
            
            # Create transaction
            transaction = {
                "date": date,
                "amount": amount,
                "description": row["Description"],
                "original_description": row["Description"],
                "source_id": f"{row['Date']}_{row['Description']}_{row['Amount']}"
            }
            
            transactions.append(transaction)
        
        # Process and return
        return self.process_transactions(transactions) 