#!/usr/bin/env python3
"""
Test script for importing CSV data
"""

import os
import sys
from datetime import datetime
import pandas as pd

from geda.db import Base, engine, SessionLocal
from geda.models import Category, Transaction, MappingRule
from geda.core import CategoryService, RuleService, TransactionService

def parse_csv(file_path):
    """Parse transactions from a CSV file"""
    # Read the CSV
    df = pd.read_csv(file_path)
    
    transactions = []
    
    for _, row in df.iterrows():
        # Parse date
        date = datetime.strptime(row["Date"], "%Y-%m-%d")
        
        # Parse amount (remove $ and convert to float)
        amount_str = str(row["Amount"]).replace("$", "").replace(",", "")
        amount = float(amount_str)
        
        # Create transaction
        transactions.append({
            "date": date,
            "amount": amount,
            "description": row["Description"],
            "source": "CSV-Import"
        })
    
    return transactions

def test_csv_import():
    """Test CSV import functionality"""
    print("Testing CSV import...")
    
    # Get the sample CSV path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_csv = os.path.join(script_dir, "test_data", "sample_transactions.csv")
    
    if not os.path.exists(sample_csv):
        print(f"Sample CSV not found: {sample_csv}")
        return False
    
    print(f"Using sample CSV: {sample_csv}")
    
    # Parse transactions
    transactions = parse_csv(sample_csv)
    
    print(f"Extracted {len(transactions)} transactions from the CSV")
    
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
        
        # Print some transaction details to show auto-categorization
        print("\nSample transactions with categories:")
        for tx in imported[:6]:
            cat_name = tx.category.name if tx.category else "Uncategorized"
            print(f"{tx.date.strftime('%Y-%m-%d')} | ${abs(tx.amount):<10.2f} | {tx.description} -> {cat_name}")
        
        return True
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = test_csv_import()
    sys.exit(0 if success else 1)