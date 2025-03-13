import os
import pandas as pd
import tabula
import PyPDF2
from typing import List, Dict, Any, Optional
from datetime import datetime
import tempfile
import re

from geda.parsers.base_parser import BaseParser

class PDFParser(BaseParser):
    """Parser for PDF statements"""
    
    source_name: str = "Unknown"  # Will be set based on detection
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse PDF and extract transactions"""
        # First, determine the source/bank
        self.detect_source(file_path)
        
        # Extract tables from PDF
        tables = self.extract_tables(file_path)
        
        # Parse based on detected source
        if "CIBC" in self.source_name:
            return self.parse_cibc(tables)
        elif "RBC" in self.source_name:
            return self.parse_rbc(tables)
        else:
            raise ValueError(f"Unsupported PDF format from source: {self.source_name}")
    
    def detect_source(self, file_path: str) -> None:
        """Detect the source bank from the PDF content"""
        # Open the PDF
        with open(file_path, "rb") as file:
            pdf = PyPDF2.PdfReader(file)
            
            # Extract text from first page
            text = pdf.pages[0].extract_text()
            
            # Look for bank identifiers
            if "CIBC" in text:
                self.source_name = "CIBC"
            elif "RBC" in text:
                self.source_name = "RBC"
            elif "AMEX" in text or "American Express" in text:
                self.source_name = "AMEX"
            else:
                self.source_name = "Unknown"
    
    def extract_tables(self, file_path: str) -> List[pd.DataFrame]:
        """Extract tables from PDF"""
        # Extract all tables from all pages
        tables = tabula.read_pdf(file_path, pages="all", multiple_tables=True)
        return tables
    
    def parse_cibc(self, tables: List[pd.DataFrame]) -> List[Dict[str, Any]]:
        """Parse CIBC PDF tables"""
        transactions = []
        
        for table in tables:
            # Skip tables that don't look like transaction tables
            if len(table.columns) < 3 or "Date" not in table.columns:
                continue
            
            for _, row in table.iterrows():
                try:
                    # Parse date
                    date_str = str(row.get("Date", ""))
                    if not date_str or pd.isna(date_str):
                        continue
                    
                    # Try different date formats
                    try:
                        date = datetime.strptime(date_str, "%b %d")
                        # Assume current year if month/day only
                        date = date.replace(year=datetime.now().year)
                    except ValueError:
                        try:
                            date = datetime.strptime(date_str, "%Y/%m/%d")
                        except ValueError:
                            # Skip rows with unparseable dates
                            continue
                    
                    # Parse description
                    description = str(row.get("Description", ""))
                    if pd.isna(description) or not description:
                        continue
                    
                    # Parse amount
                    amount_col = None
                    for col in ["Amount", "Withdrawal", "Deposit"]:
                        if col in table.columns:
                            amount_col = col
                            break
                    
                    if not amount_col:
                        continue
                    
                    amount_str = str(row.get(amount_col, ""))
                    if pd.isna(amount_str) or not amount_str:
                        continue
                    
                    # Remove currency symbols and commas
                    amount_str = amount_str.replace("$", "").replace(",", "")
                    amount = float(amount_str)
                    
                    # If it's a withdrawal, make it negative
                    if amount_col == "Withdrawal":
                        amount = -amount
                    
                    # Create transaction
                    transaction = {
                        "date": date,
                        "amount": amount,
                        "description": description,
                        "original_description": description,
                    }
                    
                    transactions.append(transaction)
                except Exception as e:
                    # Skip problematic rows
                    continue
        
        # Process and return
        return self.process_transactions(transactions)
    
    def parse_rbc(self, tables: List[pd.DataFrame]) -> List[Dict[str, Any]]:
        """Parse RBC PDF tables"""
        # Similar structure to parse_cibc but with RBC-specific logic
        transactions = []
        
        for table in tables:
            # Skip tables that don't look like transaction tables
            if len(table.columns) < 3:
                continue
            
            # Try to identify date and amount columns
            date_col = None
            amount_col = None
            desc_col = None
            
            for col in table.columns:
                col_str = str(col).lower()
                if "date" in col_str:
                    date_col = col
                elif "amount" in col_str or "total" in col_str:
                    amount_col = col
                elif "description" in col_str or "detail" in col_str:
                    desc_col = col
            
            if not (date_col and amount_col):
                continue
            
            for _, row in table.iterrows():
                try:
                    # Parse date
                    date_str = str(row.get(date_col, ""))
                    if not date_str or pd.isna(date_str):
                        continue
                    
                    # Try different date formats
                    try:
                        date = datetime.strptime(date_str, "%b %d")
                        # Assume current year if month/day only
                        date = date.replace(year=datetime.now().year)
                    except ValueError:
                        try:
                            date = datetime.strptime(date_str, "%d %b")
                            date = date.replace(year=datetime.now().year)
                        except ValueError:
                            try:
                                date = datetime.strptime(date_str, "%Y/%m/%d")
                            except ValueError:
                                # Skip rows with unparseable dates
                                continue
                    
                    # Parse description
                    description = ""
                    if desc_col:
                        description = str(row.get(desc_col, ""))
                    if pd.isna(description) or not description:
                        # Try to use another non-date, non-amount column
                        for col in table.columns:
                            if col != date_col and col != amount_col:
                                description = str(row.get(col, ""))
                                if not pd.isna(description) and description:
                                    break
                    
                    if pd.isna(description) or not description:
                        continue
                    
                    # Parse amount
                    amount_str = str(row.get(amount_col, ""))
                    if pd.isna(amount_str) or not amount_str:
                        continue
                    
                    # Remove currency symbols and commas
                    amount_str = amount_str.replace("$", "").replace(",", "")
                    
                    # Handle debit/credit indicators
                    if "CR" in amount_str:
                        amount_str = amount_str.replace("CR", "")
                        amount = float(amount_str)
                    elif "DR" in amount_str:
                        amount_str = amount_str.replace("DR", "")
                        amount = -float(amount_str)
                    else:
                        amount = float(amount_str)
                        # If this is a credit card statement, amounts are typically negative for charges
                        if "credit" in self.source_name.lower():
                            amount = -amount
                    
                    # Create transaction
                    transaction = {
                        "date": date,
                        "amount": amount,
                        "description": description,
                        "original_description": description,
                    }
                    
                    transactions.append(transaction)
                except Exception as e:
                    # Skip problematic rows
                    continue
        
        # Process and return
        return self.process_transactions(transactions)