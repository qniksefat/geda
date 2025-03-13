#!/usr/bin/env python3
"""
Simple script to test the API
"""

import requests
import json

def test_api():
    """Test basic API connectivity"""
    try:
        # Test root endpoint
        response = requests.get("http://localhost:8003")
        print(f"Root endpoint status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # Test categories endpoint
        response = requests.get("http://localhost:8003/api/categories/")
        print(f"\nCategories endpoint status: {response.status_code}")
        print(f"Found {len(response.json())} categories")
        
        # Test transactions endpoint
        response = requests.get("http://localhost:8003/api/transactions/")
        print(f"\nTransactions endpoint status: {response.status_code}")
        print(f"Found {len(response.json())} transactions")
        
        return True
    except Exception as e:
        print(f"Error testing API: {e}")
        return False

if __name__ == "__main__":
    test_api()