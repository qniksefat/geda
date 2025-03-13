#!/usr/bin/env python3
"""
Test script for the database and models
"""

import os
import sys
from datetime import datetime

from geda.db import Base, engine, SessionLocal
from geda.models import Category, Transaction, MappingRule
from geda.core import CategoryService, RuleService, TransactionService

def test_database():
    """Test database functionality"""
    print("Testing database and models...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = SessionLocal()
    
    try:
        # Create and test category service
        print("\n=== Testing CategoryService ===")
        cat_service = CategoryService(db)
        
        # Create default categories
        created_cats = cat_service.create_default_categories()
        print(f"Created {len(created_cats)} default categories")
        
        # List categories
        categories = cat_service.get_categories()
        print(f"Total categories: {len(categories)}")
        for cat in categories[:5]:  # Show just the first 5
            print(f"  - {cat.name}")
        if len(categories) > 5:
            print(f"  - ... and {len(categories)-5} more")
        
        # Create and test rule service
        print("\n=== Testing RuleService ===")
        rule_service = RuleService(db)
        
        # Create default rules
        created_rules = rule_service.create_default_rules()
        print(f"Created {len(created_rules)} default rules")
        
        # List rules
        rules = rule_service.get_rules()
        print(f"Total rules: {len(rules)}")
        for rule in rules[:5]:  # Show just the first 5
            print(f"  - {rule.pattern} -> {rule.category.name}")
        if len(rules) > 5:
            print(f"  - ... and {len(rules)-5} more")
        
        # Create and test transaction service
        print("\n=== Testing TransactionService ===")
        tx_service = TransactionService(db)
        
        # Create test transaction
        test_tx = {
            "date": datetime.now(),
            "amount": -25.99,
            "description": "STARBUCKS COFFEE",
            "source": "test"
        }
        
        tx = tx_service.create_transaction(test_tx)
        print(f"Created test transaction: {tx.description} (${abs(tx.amount):.2f})")
        print(f"Auto-categorized as: {tx.category.name if tx.category else 'None'}")
        
        # Test transaction retrieval
        tx_list = tx_service.get_transactions(limit=10)
        print(f"Retrieved {len(tx_list)} transactions")
        
        return True
    
    except Exception as e:
        print(f"Error testing database: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)