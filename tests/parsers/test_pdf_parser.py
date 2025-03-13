#!/usr/bin/env python3
"""
Test script for the PDF parser functionality
"""

import os
import sys
import pytest
from datetime import datetime
from pprint import pprint

from geda.parsers import PDFParser

@pytest.fixture
def file_path():
    """Fixture to provide the test PDF file path"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, "..", "test_data", "sample-credit-cibc.pdf")
    if not os.path.exists(file_path):
        pytest.skip(f"Test file not found: {file_path}")
    return file_path

def test_pdf_parser(file_path):
    """Test parsing a PDF file"""
    print(f"Testing PDF parser on file: {file_path}")
    
    parser = PDFParser()
    
    try:
        # Detect source
        parser.detect_source(file_path)
        print(f"Detected source: {parser.source_name}")
        
        # Parse transactions
        transactions = parser.parse(file_path)
        
        # Print results
        print(f"Found {len(transactions)} transactions:")
        for i, transaction in enumerate(transactions):
            # Format for readability
            date = transaction["date"].strftime("%Y-%m-%d")
            amount = transaction["amount"]
            description = transaction["description"]
            
            print(f"{i+1}. {date} | ${abs(amount):<10.2f} | {description}")
        
        assert len(transactions) > 0, "No transactions found in the PDF"
        return True
    
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Use the sample file path if no file is provided
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # Use sample data
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, "..", "test_data", "sample-credit-cibc.pdf")
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
    
    success = test_pdf_parser(file_path)
    sys.exit(0 if success else 1)