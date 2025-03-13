#!/usr/bin/env python3
"""
Test script for using sample data directly
"""

import os
import sys
from datetime import datetime
import re
import PyPDF2

from geda.db import Base, engine, SessionLocal
from geda.models import Category, Transaction, MappingRule
from geda.core import CategoryService, RuleService, TransactionService

def extract_transactions_from_pdf(file_path):
    """Extract transactions directly using PyPDF2 instead of tabula"""
    transactions = []
    
    # Open the PDF
    with open(file_path, "rb") as file:
        pdf = PyPDF2.PdfReader(file)
        
        # Loop through pages
        for page_num in range(len(pdf.pages)):
            page = pdf.pages[page_num]
            text = page.extract_text()
            
            # Look for transaction patterns in the text
            # This is a simplified approach - real parsing requires more complex logic
            # Pattern: date followed by description and amount
            # For example: "Mar 15 STARBUCKS COFFEE $25.99"
            
            # Look for lines with dollar amounts
            lines = text.split('\n')
            for line in lines:
                # Look for dollar amounts
                amount_match = re.search(r'\$(\d+\.\d{2})', line)
                if amount_match:
                    amount = float(amount_match.group(1))
                    
                    # Look for date pattern (very simplified)
                    date_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})', line)
                    if date_match:
                        month = date_match.group(1)
                        day = int(date_match.group(2))
                        
                        # Year is assumed to be current
                        year = datetime.now().year
                        
                        # Convert month name to number
                        month_dict = {
                            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                        }
                        month_num = month_dict.get(month, 1)
                        
                        # Create date
                        date = datetime(year, month_num, day)
                        
                        # Extract description (anything between date and amount)
                        line_after_date = line[line.find(date_match.group(0)) + len(date_match.group(0)):]
                        description = line_after_date.split('$')[0].strip()
                        
                        # Skip if description is empty or just numbers
                        if not description or description.isdigit():
                            continue
                        
                        # Create transaction
                        transactions.append({
                            "date": date,
                            "amount": -amount,  # Negative for expenses
                            "description": description,
                            "source": "CIBC"
                        })
    
    return transactions

def test_with_sample_data():
    """Test with sample data"""
    print("Testing with sample data...")
    
    # Get the sample PDF path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_pdf = os.path.join(script_dir, "test_data", "maryam-credit-cibc.pdf")
    
    if not os.path.exists(sample_pdf):
        print(f"Sample PDF not found: {sample_pdf}")
        return False
    
    print(f"Using sample PDF: {sample_pdf}")
    
    # Extract transactions
    transactions = extract_transactions_from_pdf(sample_pdf)
    
    if not transactions:
        print("No transactions found in the PDF")
        return False
    
    print(f"Extracted {len(transactions)} transactions from the PDF")
    
    # Print the first few transactions
    for i, tx in enumerate(transactions[:5]):
        print(f"{i+1}. {tx['date'].strftime('%Y-%m-%d')} | ${abs(tx['amount']):<10.2f} | {tx['description']}")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = SessionLocal()
    
    try:
        # Initialize services
        cat_service = CategoryService(db)
        rule_service = RuleService(db)
        tx_service = TransactionService(db)
        
        # Ensure we have default categories and rules
        cat_service.create_default_categories()
        rule_service.create_default_rules()
        
        # Import the transactions
        print("\nImporting transactions and auto-categorizing...")
        imported = []
        
        for tx_data in transactions:
            tx = tx_service.create_transaction(tx_data)
            imported.append(tx)
        
        # Print categorized transactions
        print("\nCategorized transactions:")
        categories = {}
        
        for tx in imported:
            cat_name = tx.category.name if tx.category else "Uncategorized"
            if cat_name in categories:
                categories[cat_name] += abs(tx.amount)
            else:
                categories[cat_name] = abs(tx.amount)
        
        # Print spending by category
        for cat_name, total in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"{cat_name}: ${total:.2f}")
        
        return True
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = test_with_sample_data()
    sys.exit(0 if success else 1)