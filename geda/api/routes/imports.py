import os
import tempfile
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from geda.api.schemas import ImportPreviewResponse, ImportRequest, Transaction
from geda.core import ImportService
from geda.db import get_db

router = APIRouter()

@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Preview transactions from a file before importing.
    
    This endpoint:
    1. Uploads the file
    2. Parses the transactions
    3. Detects potential duplicates
    4. Returns a preview of the transactions to be imported
    """
    # Save uploaded file to a temporary file
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_path = temp.name
        content = await file.read()
        temp.write(content)
    
    try:
        # Parse and check for duplicates
        service = ImportService(db)
        transactions, duplicates, import_id = service.preview_import(temp_path)
        
        # Return preview response
        return {
            "transactions": transactions,
            "total_count": len(transactions),
            "possible_duplicates": duplicates,
            "import_id": import_id
        }
    finally:
        # Cleanup temporary file
        os.unlink(temp_path)

@router.post("/confirm", response_model=List[Transaction])
def confirm_import(
    import_request: ImportRequest,
    auto_categorize: bool = True,
    db: Session = Depends(get_db)
):
    """
    Confirm and import previewed transactions.
    
    This endpoint:
    1. Takes the import_id from the preview
    2. Imports the transactions (optionally filtered by IDs)
    3. Auto-categorizes them if requested
    4. Returns the imported transactions
    """
    service = ImportService(db)
    
    # TODO: Implement the retrieval of previewed transactions by import_id
    # For now, this is a simplified version that just imports all
    transactions = service.import_transactions(
        [], # This would be the list of transaction dicts to import
        auto_categorize
    )
    
    return transactions

@router.post("/file", response_model=List[Transaction])
async def import_file(
    file: UploadFile = File(...),
    auto_categorize: bool = True,
    db: Session = Depends(get_db)
):
    """
    Import transactions directly from a file.
    
    This endpoint:
    1. Uploads the file
    2. Parses and imports the transactions
    3. Auto-categorizes them if requested
    4. Returns the imported transactions
    """
    # Get file extension from original filename
    _, ext = os.path.splitext(file.filename)
    
    # Save uploaded file to a temporary file with original extension
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp:
        temp_path = temp.name
        content = await file.read()
        temp.write(content)
    
    try:
        # Import transactions
        service = ImportService(db)
        transactions = service.import_from_file(temp_path, auto_categorize)
        
        return transactions
    finally:
        # Cleanup temporary file
        os.unlink(temp_path)